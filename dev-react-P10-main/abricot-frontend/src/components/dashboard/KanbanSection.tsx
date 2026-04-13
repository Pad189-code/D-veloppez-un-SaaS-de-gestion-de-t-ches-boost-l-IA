import Link from 'next/link';
import { Folder, Calendar } from 'lucide-react';
import type { DashboardTask, MonthTasksByStatus } from '@/lib/dashboardQueries';
import { TASK_STATUS_LABEL } from '@/lib/dashboardQueries';
import { formatTaskDueLabel } from '@/lib/formatTaskDue';

function taskStatusBadgeClassName(status: string): string {
  switch (status) {
    case 'TODO':
      return 'bg-red-50 text-red-400';
    case 'IN_PROGRESS':
      return 'bg-orange-50 text-orange-400';
    case 'DONE':
      return 'bg-green-50 text-green-500';
    default:
      return 'bg-gray-50 text-gray-500';
  }
}

function KanbanCard({ task }: { task: DashboardTask }) {
  const colorClass = taskStatusBadgeClassName(task.status);
  const statusLabel = TASK_STATUS_LABEL[task.status] ?? task.status;

  return (
    <div className="group flex w-full min-w-0 max-w-[371px] cursor-pointer flex-col gap-8 rounded-[10px] border border-[#E5E7EB] bg-white p-5 transition-all hover:shadow-md sm:p-6 md:px-10 md:py-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-[15px] font-bold leading-snug text-[#1D1D1B] sm:text-[16px]">
            {task.title}
          </h3>
          <span
            className={`${colorClass} shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider sm:px-3 sm:text-[10px]`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-gray-400">{task.description || '—'}</p>
      </div>
      <div className="flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-50 pt-4 text-[12px] text-gray-400 sm:pt-5">
          <div className="flex min-w-0 items-center gap-1.5">
            <Folder size={14} aria-hidden />
            <span className="truncate">{task.project.name}</span>
          </div>
          <span className="hidden text-gray-200 sm:inline" aria-hidden>
            |
          </span>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} aria-hidden />
            <span>{formatTaskDueLabel(task.dueDate, task.status)}</span>
          </div>
        </div>
        <Link
          href={`/projets/${task.project.id}`}
          className="w-full rounded-lg bg-[#1D1D1B] py-3 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-black"
        >
          Voir les détails
        </Link>
      </div>
    </div>
  );
}

const COLUMNS: { title: string; status: keyof MonthTasksByStatus }[] = [
  { title: 'À faire', status: 'TODO' },
  { title: 'En cours', status: 'IN_PROGRESS' },
  { title: 'Terminées', status: 'DONE' },
];

export default function KanbanSection({ byStatus }: { byStatus: MonthTasksByStatus }) {
  return (
    <div>
      <div className="flex w-full flex-col gap-8 lg:flex-row lg:justify-between lg:gap-6 xl:gap-8">
        {COLUMNS.map((col) => {
          const colTasks: DashboardTask[] = byStatus[col.status];

          return (
            <div
              key={col.status}
              className="flex w-full min-w-0 flex-1 flex-col gap-4 sm:gap-6 lg:min-w-[280px] lg:max-w-[371px]"
            >
              <div className="flex items-center gap-3 px-1 sm:px-2">
                <h2 className="text-lg font-bold text-[#1D1D1B] sm:text-xl">{col.title}</h2>
                <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {colTasks.map((task) => (
                  <KanbanCard key={task.id} task={task} />
                ))}
                {colTasks.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 sm:p-8">
                    Aucune tâche
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
