import { prisma } from '@/lib/prisma';

export const TASK_STATUS_LABEL: Record<string, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
};

export type DashboardTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  project: { id: string; name: string };
  commentCount: number;
};

export type MonthTasksByStatus = {
  TODO: DashboardTask[];
  IN_PROGRESS: DashboardTask[];
  DONE: DashboardTask[];
};

export { formatTaskDueLabel } from './formatTaskDue';

/** Clé de tri : échéance la plus proche d’abord (y compris en retard), puis sans date, puis terminées. */
function urgencySortKey(t: { dueDate: Date | null; status: string }): number {
  const st = t.status.trim().toUpperCase().replace(/\s+/g, '_');
  if (st === 'DONE') return 10_000_000_000_000_000;
  if (t.dueDate) return t.dueDate.getTime();
  return 9_000_000_000_000_000;
}

/** Plus urgent = échéance la plus proche (les retards remontent en tête). */
export function sortTasksByUrgency<
  T extends {
    dueDate: Date | null;
    status: string;
    createdAt: Date;
  },
>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const ka = urgencySortKey(a);
    const kb = urgencySortKey(b);
    if (ka !== kb) return ka - kb;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/** Tri dans une colonne Kanban : échéance croissante, puis sans date en dernier. */
function sortDashboardTasksForKanbanColumn(items: DashboardTask[]): DashboardTask[] {
  return [...items].sort((a, b) => {
    const ta = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const tb = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (ta !== tb) return ta - tb;
    return a.title.localeCompare(b.title, 'fr');
  });
}

/** Aligne le statut Prisma sur les clés Kanban / badges (tolère espaces / casse). */
function normalizeTaskStatus(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (s === 'DONE') return 'DONE';
  if (s === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (s === 'TODO') return 'TODO';
  return raw.trim();
}

function toDashboardTask(t: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
  project: { id: string; name: string };
  _count: { comments: number };
}): DashboardTask {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: normalizeTaskStatus(t.status),
    dueDate: t.dueDate?.toISOString() ?? null,
    project: t.project,
    commentCount: t._count.comments,
  };
}

export async function getDashboardSnapshot(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const userLabel = user?.name?.trim() || user?.email?.split('@')[0] || 'Utilisateur';

  const tasksRaw = await prisma.task.findMany({
    where: {
      assignees: { some: { id: userId } },
    },
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  const tasksSorted = sortTasksByUrgency(tasksRaw);
  const tasks = tasksSorted.map(toDashboardTask);

  return {
    userLabel,
    tasks,
    /** Kanban : mêmes tâches assignées que la liste, réparties par statut (À faire / En cours / Terminée). */
    monthTasksByStatus: {
      TODO: sortDashboardTasksForKanbanColumn(tasks.filter((t) => t.status === 'TODO')),
      IN_PROGRESS: sortDashboardTasksForKanbanColumn(
        tasks.filter((t) => t.status === 'IN_PROGRESS'),
      ),
      DONE: sortDashboardTasksForKanbanColumn(tasks.filter((t) => t.status === 'DONE')),
    },
  };
}
