/** Filtres optionnels pour les tâches (projet ou autre) */

export type TaskStatusFilter = 'all' | 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TaskDueFilter = 'all' | 'overdue' | 'this_week' | 'this_month' | 'none';

export type TaskAssigneeFilter = 'all' | 'unassigned' | string;

export type TaskFilterState = {
  query: string;
  status: TaskStatusFilter;
  assignee: TaskAssigneeFilter;
  due: TaskDueFilter;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return startOfDay(x);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function taskMatchesDueFilter(
  dueIso: string | null,
  status: string,
  filter: TaskDueFilter,
): boolean {
  if (filter === 'all') return true;

  const now = new Date();
  const today = startOfDay(now);

  if (filter === 'none') {
    return dueIso == null;
  }

  if (!dueIso) return false;

  const due = startOfDay(new Date(dueIso));

  if (filter === 'overdue') {
    return due < today && status !== 'DONE';
  }

  if (filter === 'this_week') {
    const end = addDays(today, 7);
    return due >= today && due <= end;
  }

  if (filter === 'this_month') {
    return isSameMonth(due, now);
  }

  return true;
}

export function taskMatchesAssigneeFilter(
  assigneeIds: readonly string[],
  filter: TaskAssigneeFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'unassigned') return assigneeIds.length === 0;
  return assigneeIds.includes(filter);
}

export function taskMatchesStatusFilter(status: string, filter: TaskStatusFilter): boolean {
  if (filter === 'all') return true;
  return status === filter;
}

export function taskMatchesTextQuery(
  title: string,
  description: string | null,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${title} ${description ?? ''}`.toLowerCase();
  return hay.includes(q);
}
