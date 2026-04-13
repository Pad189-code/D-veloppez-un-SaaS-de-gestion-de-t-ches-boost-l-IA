import { redirect } from 'next/navigation';

/** Redirection depuis l’ancienne route `/dashboard/kanban` vers `?vue=kanban`. */
export default function DashboardKanbanRedirectPage() {
  redirect('/dashboard?vue=kanban');
}
