'use server';

/** Tâches : création / mise à jour, génération IA (Mistral avec repli local si pas de clé), RAG projet via `lib/ragProjectTasks`. */

import 'server-only';

import { prisma } from '../../lib/prisma';
import { formatRagBlockForPrompt, retrieveProjectTasksForRag } from '../../lib/ragProjectTasks';
import { canModifyProject, getCurrentUserId, hasProjectAccess } from '@/lib/projectPermissions';
import { revalidatePath } from 'next/cache';

async function requireProjectAccess(
  projectId: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, error: 'Authentification requise.' };
  }
  const allowed = await hasProjectAccess(userId, projectId);
  if (!allowed) {
    return { ok: false, error: 'Accès refusé à ce projet.' };
  }
  return { ok: true, userId };
}

export type CreateTaskInput = {
  projectId: string;
  title: string;
  description: string;
  /** Ignoré côté serveur si l’utilisateur n’est pas admin de projet (`canModifyProject`). */
  dueDate?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeIds: string[];
};

export async function createTaskAction(input: CreateTaskInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 2) {
    return { error: 'Le titre est trop court.' };
  }
  if (!description) {
    return { error: 'La description est requise.' };
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { id: true },
  });
  if (!project) {
    return { error: 'Projet introuvable.' };
  }

  const access = await requireProjectAccess(input.projectId);
  if (!access.ok) {
    return { error: access.error };
  }

  const canSetDeadline = await canModifyProject(access.userId, input.projectId);
  let due: Date | null = null;
  if (canSetDeadline) {
    if (!input.dueDate) {
      return { error: "La date d'échéance est requise." };
    }
    const parsed = new Date(input.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      return { error: 'Date invalide.' };
    }
    due = parsed;
  }

  await prisma.task.create({
    data: {
      title,
      description,
      dueDate: due,
      status: input.status,
      projectId: input.projectId,
      ...(input.assigneeIds.length > 0 && {
        assignees: {
          connect: input.assigneeIds.map((id) => ({ id })),
        },
      }),
    },
  });

  revalidatePath(`/projets/${input.projectId}`);
  return { success: true as const };
}

export type UpdateTaskInput = {
  projectId: string;
  taskId: string;
  title: string;
  description: string;
  /** Ignoré si l’utilisateur n’est pas admin de projet — l’échéance existante est conservée. */
  dueDate?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeIds: string[];
};

export async function updateTaskAction(input: UpdateTaskInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 2) {
    return { error: 'Le titre est trop court.' };
  }
  if (!description) {
    return { error: 'La description est requise.' };
  }

  const existing = await prisma.task.findFirst({
    where: {
      id: input.taskId,
      projectId: input.projectId,
    },
    select: { id: true, dueDate: true },
  });
  if (!existing) {
    return { error: 'Tâche introuvable.' };
  }

  const access = await requireProjectAccess(input.projectId);
  if (!access.ok) {
    return { error: access.error };
  }

  const canSetDeadline = await canModifyProject(access.userId, input.projectId);
  let due: Date | null;
  if (canSetDeadline) {
    if (!input.dueDate) {
      return { error: "La date d'échéance est requise." };
    }
    const parsed = new Date(input.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      return { error: 'Date invalide.' };
    }
    due = parsed;
  } else {
    due = existing.dueDate;
  }

  await prisma.task.update({
    where: { id: input.taskId },
    data: {
      title,
      description,
      dueDate: due,
      status: input.status,
      assignees: {
        set: input.assigneeIds.map((id) => ({ id })),
      },
    },
  });

  revalidatePath(`/projets/${input.projectId}`);
  return { success: true as const };
}

export async function deleteTaskAction(input: {
  projectId: string;
  taskId: string;
}): Promise<{ success: true } | { error: string }> {
  const access = await requireProjectAccess(input.projectId);
  if (!access.ok) {
    return { error: access.error };
  }

  const task = await prisma.task.findFirst({
    where: { id: input.taskId, projectId: input.projectId },
    select: { id: true },
  });
  if (!task) {
    return { error: 'Tâche introuvable.' };
  }

  await prisma.task.delete({
    where: { id: input.taskId },
  });

  revalidatePath(`/projets/${input.projectId}`);
  return { success: true as const };
}

type TaskDraft = { title: string; description: string };
const MIN_TITLE_LEN = 2;
const MAX_AI_TASKS = 3;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.58;
const EXISTING_TASK_SCAN_LIMIT = 400;

/**
 * Modèle Mistral (API chat completions). Voir https://docs.mistral.ai/api/#tag/chat
 * La clé `MISTRAL_API_KEY` est lue uniquement côté serveur (ce module est `server-only`) — jamais exposée au navigateur.
 */
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';

function parseTasksJson(text: string): TaskDraft[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']') + 1;
  if (start === -1 || end <= start) {
    throw new Error('Réponse IA : JSON de tâches introuvable');
  }
  const parsed = JSON.parse(text.substring(start, end)) as TaskDraft[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Réponse IA : tableau de tâches vide');
  }
  return parsed.map((t) => ({
    title: String(t.title ?? '').trim() || 'Tâche',
    description: String(t.description ?? '').trim() || '',
  }));
}

function normalizeLooseText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value: string): Set<string> {
  const tokens = normalizeLooseText(value)
    .split(' ')
    .filter((t) => t.length > 2);
  return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function sanitizeAndDedupeDrafts(
  drafts: TaskDraft[],
  existingTitles: string[],
  maxTasks: number = MAX_AI_TASKS,
): TaskDraft[] {
  const existingSets = existingTitles.map((t) => tokenSet(t));
  const kept: TaskDraft[] = [];
  const keptSets: Set<string>[] = [];

  for (const draft of drafts) {
    const title = draft.title.trim();
    const description = draft.description.trim();
    if (title.length < MIN_TITLE_LEN) continue;

    const currentSet = tokenSet(title);
    if (currentSet.size === 0) continue;

    const nearExisting = existingSets.some((s) => jaccard(currentSet, s) >= 0.6);
    if (nearExisting) continue;

    const nearKept = keptSets.some((s) => jaccard(currentSet, s) >= 0.72);
    if (nearKept) continue;

    kept.push({ title, description });
    keptSets.push(currentSet);
    if (kept.length >= maxTasks) break;
  }

  return kept;
}

function draftFingerprint(title: string, description: string): Set<string> {
  return tokenSet(`${title} ${description}`);
}

async function removeNearExistingProjectTasks(
  projectId: string,
  drafts: TaskDraft[],
): Promise<{ kept: TaskDraft[]; removedCount: number }> {
  if (drafts.length === 0) {
    return { kept: [], removedCount: 0 };
  }

  const existing = await prisma.task.findMany({
    where: { projectId },
    select: { title: true, description: true },
    orderBy: { createdAt: 'desc' },
    take: EXISTING_TASK_SCAN_LIMIT,
  });

  if (existing.length === 0) {
    return { kept: drafts, removedCount: 0 };
  }

  const existingTitleNorm = new Set(existing.map((e) => normalizeLooseText(e.title)));
  const existingFingerprints = existing.map((e) => draftFingerprint(e.title, e.description ?? ''));

  const kept: TaskDraft[] = [];
  let removedCount = 0;

  for (const draft of drafts) {
    const titleNorm = normalizeLooseText(draft.title);
    if (existingTitleNorm.has(titleNorm)) {
      removedCount += 1;
      continue;
    }

    const fp = draftFingerprint(draft.title, draft.description);
    const tooClose = existingFingerprints.some((existingFp) => {
      const score = jaccard(fp, existingFp);
      return score >= DUPLICATE_SIMILARITY_THRESHOLD;
    });

    if (tooClose) {
      removedCount += 1;
      continue;
    }

    kept.push(draft);
  }

  return { kept, removedCount };
}

function buildLocalTasks(project: { name: string; description: string | null }): TaskDraft[] {
  const desc = project.description?.trim();
  return [
    {
      title: `Cadrage — ${project.name}`,
      description: desc || 'Définir le périmètre, les livrables et les critères de succès.',
    },
    {
      title: `Réalisation — ${project.name}`,
      description:
        'Implémenter les fonctionnalités prévues et assurer la cohérence avec le reste du produit.',
    },
    {
      title: `Qualité & livraison — ${project.name}`,
      description: 'Tests, corrections et préparation à la mise en production ou à la revue.',
    },
  ];
}

async function generateTextWithMistral(prompt: string): Promise<string | null> {
  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    await response.json().catch(() => ({}));
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? null;
}

export async function generateTasksWithAI(projectId: string) {
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Projet non trouvé');

    const access = await requireProjectAccess(projectId);
    if (!access.ok) {
      return { error: access.error };
    }

    const seedForRag =
      [project.description?.trim(), project.name].filter(Boolean).join('\n') || project.name;
    const ragLines = await retrieveProjectTasksForRag(projectId, seedForRag);
    const ragBlock = formatRagBlockForPrompt(ragLines);
    const existingTitles = ragLines.map((l) => l.title);

    const prompt = `${ragBlock}
Agis comme un chef de projet. Pour le projet "${project.name}" (${project.description || 'Pas de description'}), génère exactement 3 tâches prioritaires complémentaires (sans dupliquer les tâches déjà listées dans le contexte ci-dessus). Réponds uniquement sous forme de tableau JSON pur : [{"title": "Titre", "description": "Détails"}]`;

    const rawText: string | null = await generateTextWithMistral(prompt);
    let source: 'mistral' | 'local' = rawText ? 'mistral' : 'local';

    let tasksData: TaskDraft[];
    if (rawText) {
      try {
        tasksData = parseTasksJson(rawText);
      } catch {
        tasksData = buildLocalTasks(project);
        source = 'local';
      }
    } else {
      tasksData = buildLocalTasks(project);
    }

    const cleanedDrafts = sanitizeAndDedupeDrafts(tasksData, existingTitles, MAX_AI_TASKS);
    const fallbackDrafts = cleanedDrafts.length > 0 ? cleanedDrafts : buildLocalTasks(project);
    const { kept: finalDrafts, removedCount } = await removeNearExistingProjectTasks(
      projectId,
      fallbackDrafts,
    );

    if (finalDrafts.length === 0) {
      return {
        error:
          'Les propositions IA sont trop proches des tâches déjà présentes. Reformulez la demande avec un objectif plus spécifique.',
      };
    }

    await prisma.task.createMany({
      data: finalDrafts.map((t) => ({
        title: t.title,
        description: t.description,
        projectId,
        status: 'TODO',
      })),
    });

    revalidatePath(`/projets/${projectId}`);
    return {
      success: true as const,
      source,
      message:
        source === 'local'
          ? 'Tâches ajoutées (mode hors API : définissez MISTRAL_API_KEY dans .env.local).'
          : removedCount > 0 || finalDrafts.length < MAX_AI_TASKS
            ? 'Certaines propositions trop proches des tâches existantes ont été écartées.'
            : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return { error: message };
  }
}

export type AiTaskDraftInput = {
  title: string;
  description: string;
};

/**
 * Génère des tâches (aperçu, sans enregistrement) à partir du texte utilisateur.
 */
export async function previewTasksFromAiPrompt(
  projectId: string,
  userInstructions: string,
): Promise<
  | {
      success: true;
      tasks: AiTaskDraftInput[];
      source: 'mistral' | 'local';
      /** Titres des tâches projet injectées comme contexte RAG (transparence) */
      ragContextTitles: string[];
    }
  | { error: string }
> {
  const instr = userInstructions.trim();
  if (instr.length < 3) {
    return { error: 'Décrivez les tâches souhaitées (au moins 3 caractères).' };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, description: true },
  });
  if (!project) {
    return { error: 'Projet introuvable.' };
  }

  const access = await requireProjectAccess(projectId);
  if (!access.ok) {
    return { error: access.error };
  }

  const ragLines = await retrieveProjectTasksForRag(projectId, instr);
  const ragBlock = formatRagBlockForPrompt(ragLines);
  const ragContextTitles = ragLines.map((l) => l.title);

  const prompt = `Tu es chef de projet. Contexte :
- Nom du projet : "${project.name}"
- Description : ${project.description || 'Non renseignée'}

${ragBlock}
Demande utilisateur pour les tâches à proposer :
${instr}

Consignes :
- Propose exactement 3 nouvelles tâches utiles qui complètent le projet.
- Si des tâches existantes sont listées ci-dessus, ne les recopie pas et évite les doublons évidents ; propose des tâches complémentaires.
- Réponds uniquement avec un tableau JSON de 3 objets exactement, sans markdown ni texte autour :
[{"title":"...","description":"..."}]`;

  const rawText: string | null = await generateTextWithMistral(prompt);
  let source: 'mistral' | 'local' = rawText ? 'mistral' : 'local';
  let tasksData: TaskDraft[];

  if (rawText) {
    try {
      tasksData = parseTasksJson(rawText);
    } catch {
      tasksData = buildLocalTasks(project);
      source = 'local';
    }
  } else {
    tasksData = buildLocalTasks(project);
  }

  const cleanedDrafts = sanitizeAndDedupeDrafts(tasksData, ragContextTitles, MAX_AI_TASKS);
  const finalTasks = cleanedDrafts.length > 0 ? cleanedDrafts : buildLocalTasks(project);

  return {
    success: true,
    tasks: finalTasks.map((t) => ({
      title: t.title,
      description: t.description,
    })),
    source,
    ragContextTitles,
  };
}

/** Enregistre en base les tâches validées depuis l’aperçu IA. */
export async function commitAiTaskDrafts(projectId: string, drafts: AiTaskDraftInput[]) {
  const rows = drafts
    .map((d) => ({
      title: d.title.trim(),
      description: d.description.trim() || null,
    }))
    .filter((d) => d.title.length >= 2);

  if (rows.length === 0) {
    return { error: 'Aucune tâche valide à ajouter.' };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    return { error: 'Projet introuvable.' };
  }

  const access = await requireProjectAccess(projectId);
  if (!access.ok) {
    return { error: access.error };
  }

  const normalizedDrafts: TaskDraft[] = rows.map((r) => ({
    title: r.title,
    description: r.description ?? '',
  }));
  const { kept: filteredDrafts, removedCount } = await removeNearExistingProjectTasks(
    projectId,
    normalizedDrafts,
  );

  if (filteredDrafts.length === 0) {
    return {
      error:
        'Aucune tâche ajoutée : les propositions sont trop proches de tâches déjà existantes dans ce projet.',
    };
  }

  await prisma.task.createMany({
    data: filteredDrafts.map((t) => ({
      title: t.title,
      description: t.description || null,
      projectId,
      status: 'TODO',
    })),
  });

  revalidatePath(`/projets/${projectId}`);
  return {
    success: true as const,
    message:
      removedCount > 0
        ? `${removedCount} proposition(s) trop proche(s) de l'existant ont été ignorées.`
        : undefined,
  };
}
