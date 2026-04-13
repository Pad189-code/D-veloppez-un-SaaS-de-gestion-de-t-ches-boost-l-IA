/** Tri « priorité » aligné tableau de bord (échéance, puis sans date, puis terminées). */

export type SortableProjectTask = {
  dueDate: string | null;
  status: string;
  createdAt: string;
};

function urgencyKey(t: SortableProjectTask): number {
  if (t.status === 'DONE') return 10_000_000_000_000_000;
  if (t.dueDate) return new Date(t.dueDate).getTime();
  return 9_000_000_000_000_000;
}

export function sortProjectTasksByUrgency<T extends SortableProjectTask>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const ka = urgencyKey(a);
    const kb = urgencyKey(b);
    if (ka !== kb) return ka - kb;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
