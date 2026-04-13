import Link from 'next/link';
import { Folder, Calendar, MessageSquare } from 'lucide-react';
import { TASK_STATUS_LABEL, type DashboardTask } from '@/lib/dashboardQueries';
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

export default function TaskListSection({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 md:p-10">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#1D1D1B]">Mes tâches assignées</h2>
        <p className="mt-1 text-sm text-gray-500">
          Triées par urgence (échéance la plus proche en premier)
        </p>
      </div>

      {tasks.length === 0 ? (
        <p className="py-12 text-center text-gray-500">
          Aucune tâche ne vous est assignée pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-gray-100 p-4 transition-all hover:border-orange-200 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div className="min-w-0 flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <h3 className="text-base font-bold text-[#1D1D1B] sm:text-lg">{task.title}</h3>
                  <span
                    className={`${taskStatusBadgeClassName(task.status)} rounded-full px-3 py-1 text-[11px] font-bold uppercase`}
                  >
                    {TASK_STATUS_LABEL[task.status] ?? task.status}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-gray-400">{task.description || '—'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-gray-400 sm:mt-4">
                  <div className="flex items-center gap-1.5">
                    <Folder size={14} />
                    <span>{task.project.name}</span>
                  </div>
                  <span className="text-gray-200">|</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{formatTaskDueLabel(task.dueDate, task.status)}</span>
                  </div>
                  <span className="text-gray-200">|</span>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    <span>{task.commentCount}</span>
                  </div>
                </div>
              </div>
              <Link
                href={`/projets/${task.project.id}`}
                className="shrink-0 rounded-xl bg-[#1D1D1B] px-6 py-2.5 text-center text-sm font-medium text-white transition hover:bg-black sm:px-10"
              >
                Voir
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
