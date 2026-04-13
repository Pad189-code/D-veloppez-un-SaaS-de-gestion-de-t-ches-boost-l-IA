const fmtShort = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d);

/** Libellé d’échéance (liste projet, tableau de bord, kanban) — sans dépendance Prisma. */
export function formatTaskDueLabel(iso: string | null, status: string): string {
  if (!iso) return "Pas d'échéance";
  const d = new Date(iso);
  if (status === 'DONE') return fmtShort(d);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);
  if (diffDays < 0) return `En retard (${fmtShort(d)})`;
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  return fmtShort(d);
}

/** Libellé type maquette Figma : « Échéance : 9 mars » (carte tâche détaillée). */
export function formatTaskDueCardCaption(iso: string | null): string {
  if (!iso) return 'Échéance : —';
  const d = new Date(iso);
  const label = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(d);
  return `Échéance : ${label}`;
}
