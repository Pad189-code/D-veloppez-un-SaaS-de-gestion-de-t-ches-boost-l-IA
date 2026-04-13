import 'server-only';

import { prisma } from './prisma';

const TOP_K = 12;
const SCAN_LIMIT = 200;
const MAX_SNIPPET = 220;
const FALLBACK_RECENT = 6;

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
  return [...new Set(raw)];
}

function truncateSnippet(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function relevanceScore(keywords: string[], title: string, description: string | null): number {
  if (keywords.length === 0) return 0;
  const blob = normalizeText(`${title} ${description ?? ''}`);
  let score = 0;
  for (const kw of keywords) {
    if (blob.includes(kw)) score += 2;
  }
  return score;
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
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { title: true, description: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: SCAN_LIMIT,
  });

  if (tasks.length === 0) return [];

  const keywords = extractKeywords(userPrompt);
  const scored = tasks.map((t) => ({
    task: t,
    score: relevanceScore(keywords, t.title, t.description),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.task.createdAt.getTime() - a.task.createdAt.getTime();
  });

  const withHits = scored.filter((s) => s.score > 0).slice(0, TOP_K);
  const picked = withHits.length > 0 ? withHits : scored.slice(0, FALLBACK_RECENT);

  return picked.map((s) => ({
    title: s.task.title,
    snippet: truncateSnippet(s.task.description ?? '', MAX_SNIPPET),
  }));
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
