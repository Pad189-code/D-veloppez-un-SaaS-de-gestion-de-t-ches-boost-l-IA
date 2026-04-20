import 'server-only';

import { prisma } from './prisma';

const TOP_K = 12;
const SCAN_LIMIT = 200;
const MAX_SNIPPET = 220;
const FALLBACK_RECENT = 6;
const MAX_QUERY_KEYWORDS = 18;
const RECENCY_WINDOW_DAYS = 30;
const MMR_LAMBDA = 0.75;

/** Mots-outils FR courants (léger) pour le scoring par chevauchement lexical */
const STOPWORDS = new Set([
  'les',
  'des',
  'une',
  'pour',
  'avec',
  'dans',
  'sur',
  'par',
  'est',
  'son',
  'ses',
  'aux',
  'que',
  'qui',
  'cette',
  'comme',
  'plus',
  'tout',
  'tous',
  'toutes',
  'être',
  'avoir',
  'faire',
  'fait',
  'aussi',
  'très',
  'mais',
  'donc',
  'alors',
  'notre',
  'votre',
  'leur',
  'leurs',
  'cela',
  'celui',
  'celle',
  'chez',
  'entre',
  'sous',
  'vers',
  'sans',
  'dont',
]);

export type RagTaskLine = {
  title: string;
  snippet: string;
};

function normalizeText(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function extractKeywords(text: string): string[] {
  const raw = normalizeText(text)
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return [...new Set(raw)].slice(0, MAX_QUERY_KEYWORDS);
}

function truncateSnippet(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

type IndexedTask = {
  title: string;
  description: string | null;
  createdAt: Date;
  status: string;
  dueDate: Date | null;
  tokens: string[];
  tokenSet: Set<string>;
  normalizedBlob: string;
};

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function trigrams(text: string): Set<string> {
  const t = normalizeText(text).replace(/\s+/g, ' ').trim();
  const grams = new Set<string>();
  if (t.length <= 3) {
    if (t.length > 0) grams.add(t);
    return grams;
  }
  for (let i = 0; i <= t.length - 3; i += 1) {
    grams.add(t.slice(i, i + 3));
  }
  return grams;
}

function jaccardSet(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function recencyBoost(createdAt: Date): number {
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - ageDays / RECENCY_WINDOW_DAYS);
}

function buildInvertedIndex(tasks: IndexedTask[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const task of tasks) {
    for (const term of task.tokenSet) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  return df;
}

function bm25Score(
  keywords: string[],
  task: IndexedTask,
  df: Map<string, number>,
  totalDocs: number,
  avgDocLen: number,
): number {
  if (keywords.length === 0 || totalDocs === 0) return 0;
  if (task.tokens.length === 0) return 0;

  const k1 = 1.2;
  const b = 0.75;
  const tf = new Map<string, number>();
  for (const token of task.tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }

  let score = 0;
  for (const kw of keywords) {
    const f = tf.get(kw) ?? 0;
    if (f === 0) continue;
    const docFreq = df.get(kw) ?? 0;
    const idf = Math.log(1 + (totalDocs - docFreq + 0.5) / (docFreq + 0.5));
    const numerator = f * (k1 + 1);
    const denominator = f + k1 * (1 - b + (b * task.tokens.length) / Math.max(avgDocLen, 1));
    score += idf * (numerator / denominator);
  }
  return score;
}

function pickDiversifiedTasks(candidates: Array<{ task: IndexedTask; score: number }>, limit: number) {
  const selected: Array<{ task: IndexedTask; score: number }> = [];
  const remaining = [...candidates];

  while (remaining.length > 0 && selected.length < limit) {
    let bestIdx = 0;
    let bestMmr = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const current = remaining[i];
      const maxSimilarity =
        selected.length === 0
          ? 0
          : Math.max(
              ...selected.map((s) => jaccardSet(trigrams(current.task.title), trigrams(s.task.title))),
            );
      const mmr = MMR_LAMBDA * current.score - (1 - MMR_LAMBDA) * maxSimilarity;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected;
}

/**
 * Récupère des tâches du projet les plus pertinentes pour le prompt (chevauchement lexical),
 * avec repli sur les tâches récentes si aucun mot-clé ne matche.
 * Sert de couche « retrieval » avant génération (RAG sans embeddings).
 */
export async function retrieveProjectTasksForRag(
  projectId: string,
  userPrompt: string,
): Promise<RagTaskLine[]> {
  const rawTasks = await prisma.task.findMany({
    where: { projectId },
    select: { title: true, description: true, createdAt: true, status: true, dueDate: true },
    orderBy: { createdAt: 'desc' },
    take: SCAN_LIMIT,
  });

  if (rawTasks.length === 0) return [];

  const keywords = extractKeywords(userPrompt);
  const queryTokenSet = new Set(keywords);
  const queryTrigrams = trigrams(userPrompt);

  const tasks: IndexedTask[] = rawTasks.map((t) => {
    const normalizedBlob = normalizeText(`${t.title} ${t.description ?? ''}`);
    const tokens = tokenize(`${t.title} ${t.description ?? ''}`);
    return {
      ...t,
      normalizedBlob,
      tokens,
      tokenSet: new Set(tokens),
    };
  });

  const df = buildInvertedIndex(tasks);
  const avgDocLen =
    tasks.reduce((acc, task) => acc + task.tokens.length, 0) / Math.max(tasks.length, 1);

  const scored = tasks.map((task) => {
    const lexicalScore = bm25Score(keywords, task, df, tasks.length, avgDocLen);
    const tokenOverlapScore = jaccardSet(queryTokenSet, task.tokenSet);
    const fuzzyScore = jaccardSet(queryTrigrams, trigrams(task.normalizedBlob));
    const phraseBoost = normalizeText(userPrompt)
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 8)
      .some((phrase) => task.normalizedBlob.includes(phrase))
      ? 0.4
      : 0;
    const recencyScore = recencyBoost(task.createdAt);

    // Priorise les tâches "actives" (TODO / IN_PROGRESS) pour coller au besoin courant.
    const statusBoost = task.status === 'DONE' ? 0 : 0.25;

    const score =
      lexicalScore * 1.15 +
      tokenOverlapScore * 0.8 +
      fuzzyScore * 0.55 +
      recencyScore * 0.3 +
      phraseBoost +
      statusBoost;
    return { task, score };
  });

  scored.sort((a, b) => b.score - a.score || b.task.createdAt.getTime() - a.task.createdAt.getTime());

  const withHits = scored.filter((s) => s.score > 0.2);
  const picked =
    withHits.length > 0
      ? pickDiversifiedTasks(withHits.slice(0, TOP_K * 2), TOP_K)
      : scored.slice(0, FALLBACK_RECENT);

  return picked.map(({ task }) => {
    const due = task.dueDate ? `Échéance: ${task.dueDate.toISOString().slice(0, 10)}.` : '';
    const status = `Statut: ${task.status}.`;
    const desc = truncateSnippet(task.description ?? '', MAX_SNIPPET);
    const metaSnippet = `${status} ${due} ${desc}`.trim();
    return {
      title: task.title,
      snippet: metaSnippet,
    };
  });
}

export function formatRagBlockForPrompt(lines: RagTaskLine[]): string {
  if (lines.length === 0) return '';

  const body = lines
    .map((l, i) => {
      const desc = l.snippet ? ` — ${l.snippet}` : '';
      return `${i + 1}. ${l.title}${desc}`;
    })
    .join('\n');

  return `## Tâches déjà présentes dans ce projet (contexte retrieval — ne pas dupliquer ; rester cohérent)

${body}
`;
}
