'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Search,
  CalendarDays,
} from 'lucide-react';
import CreateTaskModal, { type CollaboratorOption } from '@/components/CreateTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import type { TaskCardModel } from '@/types/task';
import { formatTaskDueCardCaption } from '@/lib/formatTaskDue';
import {
  taskMatchesStatusFilter,
  taskMatchesTextQuery,
  type TaskStatusFilter,
} from '@/lib/taskFilters';
import { sortProjectTasksByUrgency } from '@/lib/projectTaskSort';
import { addTaskCommentAction } from '@/app/actions/commentActions';
import { deleteTaskAction } from '@/app/actions/taskActions';

export type { TaskCardModel };

const STATUS_LABEL: Record<string, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
  CANCELLED: 'Annulée',
};

function taskStatusBadgeClassName(status: string): string {
  switch (status) {
    case 'TODO':
      return 'bg-rose-50 text-rose-600 ring-1 ring-rose-100';
    case 'IN_PROGRESS':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100';
    case 'DONE':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';
    default:
      return 'bg-gray-50 text-gray-600';
  }
}

function assigneeChips(task: TaskCardModel, collaborators: CollaboratorOption[]) {
  const list =
    task.assignees?.map((a) => ({ id: a.id, label: a.label })) ??
    task.assigneeIds.map((id) => {
      const c = collaborators.find((x) => x.id === id);
      return {
        id,
        label: (c?.name && c.name.trim()) || c?.email || id,
      };
    });
  return list;
}

function initialsFromLabel(label: string): string {
  const p = label.trim().split(/\s+/);
  if (p.length >= 2) return `${p[0]![0]!}${p[1]![0]!}`.toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

function formatCommentDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

interface ProjectTasksSectionProps {
  projectId: string;
  tasks: TaskCardModel[];
  collaborators: CollaboratorOption[];
  canSetTaskDeadline: boolean;
  createModalOpen: boolean;
  onCreateModalOpenChange: (open: boolean) => void;
}

export default function ProjectTasksSection({
  projectId,
  tasks,
  collaborators,
  canSetTaskDeadline,
  createModalOpen,
  onCreateModalOpenChange,
}: ProjectTasksSectionProps) {
  const router = useRouter();
  const [editingTask, setEditingTask] = useState<TaskCardModel | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [taskView, setTaskView] = useState<'liste' | 'calendrier'>('liste');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [commentBusyId, setCommentBusyId] = useState<string | null>(null);
  const [commentErr, setCommentErr] = useState<Record<string, string | undefined>>({});
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!menuTaskId) return;
    const close = (e: MouseEvent) => {
      const el = document.querySelector(`[data-task-menu="${menuTaskId}"]`);
      if (el && !el.contains(e.target as Node)) setMenuTaskId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuTaskId]);

  const filteredTasks = useMemo(() => {
    const f = tasks.filter((t) => {
      if (!taskMatchesTextQuery(t.title, t.description, query)) return false;
      if (!taskMatchesStatusFilter(t.status, statusFilter)) return false;
      return true;
    });
    return sortProjectTasksByUrgency(f);
  }, [tasks, query, statusFilter]);

  async function submitComment(taskId: string) {
    const text = (commentDraft[taskId] ?? '').trim();
    if (!text) return;
    setCommentBusyId(taskId);
    setCommentErr((e) => ({ ...e, [taskId]: undefined }));
    const res = await addTaskCommentAction({
      projectId,
      taskId,
      content: text,
    });
    setCommentBusyId(null);
    if ('error' in res) {
      setCommentErr((e) => ({ ...e, [taskId]: res.error }));
      return;
    }
    setCommentDraft((d) => ({ ...d, [taskId]: '' }));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1D1D1B]">Tâches</h2>
            <p className="mt-1 text-sm text-gray-500">Par ordre de priorité</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
            <div
              className="inline-flex rounded-lg border border-gray-200 bg-[#FAFAFA] p-1"
              role="group"
              aria-label="Mode d’affichage des tâches"
            >
              <button
                type="button"
                onClick={() => setTaskView('liste')}
                aria-pressed={taskView === 'liste'}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  taskView === 'liste'
                    ? 'bg-white text-[#E86B32] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <CheckSquare className="h-4 w-4" strokeWidth={2} aria-hidden />
                Liste
              </button>
              <button
                type="button"
                onClick={() => setTaskView('calendrier')}
                aria-pressed={taskView === 'calendrier'}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  taskView === 'calendrier'
                    ? 'bg-white text-[#E86B32] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <CalendarDays className="h-4 w-4" strokeWidth={2} aria-hidden />
                Calendrier
              </button>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="task-status-filter">
                Statut
              </label>
              <select
                id="task-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatusFilter)}
                className="rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm font-medium text-[#374151] outline-none focus:border-[#E86B32] focus:ring-2 focus:ring-[#E86B32]/20"
              >
                <option value="all">Statut</option>
                <option value="TODO">À faire</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="DONE">Terminée</option>
              </select>

              <div className="relative min-w-[200px] flex-1">
                <label htmlFor={`task-search-${projectId}`} className="sr-only">
                  Rechercher une tâche
                </label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                  aria-hidden
                />
                <input
                  id={`task-search-${projectId}`}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une tâche"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#E86B32] focus:ring-2 focus:ring-[#E86B32]/20"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        </div>

        {taskView === 'calendrier' ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-[#FAFAFA] py-16 text-center">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="font-medium text-gray-600">Vue calendrier</p>
            <p className="mt-1 text-sm text-gray-400">Bientôt disponible</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
            <p className="text-gray-400">
              Votre liste est vide. Créez une tâche ou laissez l&apos;IA vous aider ! ✨
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 py-12 text-center text-sm text-gray-700">
            Aucune tâche ne correspond aux filtres.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {filteredTasks.map((task) => {
              const chips = assigneeChips(task, collaborators);
              const open = expandedComments[task.id] ?? false;
              const previews = task.commentsPreview ?? [];

              return (
                <li
                  key={task.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-orange-100 hover:shadow-md md:p-6"
                >
                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-[#1D1D1B]">{task.title}</h3>
                          <span
                            className={`shrink-0 rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${taskStatusBadgeClassName(task.status)}`}
                          >
                            {STATUS_LABEL[task.status] ?? task.status}
                          </span>
                        </div>
                        <div className="relative shrink-0" data-task-menu={task.id}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuTaskId((id) => (id === task.id ? null : task.id));
                            }}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Options tâche"
                          >
                            <MoreVertical className="h-5 w-5" strokeWidth={2} />
                          </button>
                          {menuTaskId === task.id && (
                            <div className="absolute right-0 z-20 mt-1 min-w-[160px] rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                  setEditingTask(task);
                                  setMenuTaskId(null);
                                }}
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                disabled={deletingTaskId === task.id}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      'Supprimer cette tâche ? Les commentaires associés seront aussi supprimés.',
                                    )
                                  ) {
                                    return;
                                  }
                                  setDeletingTaskId(task.id);
                                  setMenuTaskId(null);
                                  const result = await deleteTaskAction({
                                    projectId,
                                    taskId: task.id,
                                  });
                                  setDeletingTaskId(null);
                                  if ('error' in result && result.error) {
                                    window.alert(result.error);
                                    return;
                                  }
                                  router.refresh();
                                }}
                              >
                                {deletingTaskId === task.id ? 'Suppression…' : 'Supprimer'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {task.description && (
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                          {formatTaskDueCardCaption(task.dueDate)}
                        </span>
                      </div>

                      {chips.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">Assigné à :</span>
                          {chips.map((c) => (
                            <span
                              key={c.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-[#F9FAFB] py-1 pl-1 pr-2.5 text-xs font-medium text-[#374151]"
                            >
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                                {initialsFromLabel(c.label)}
                              </span>
                              {c.label}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 border-t border-gray-100 pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedComments((prev) => ({
                              ...prev,
                              [task.id]: !open,
                            }))
                          }
                          aria-expanded={open}
                          aria-controls={`task-comments-panel-${task.id}`}
                          className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-600 transition hover:text-[#E86B32]"
                        >
                          <span>Commentaires ({task.commentCount})</span>
                          {open ? (
                            <ChevronUp className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                          )}
                        </button>
                        {open && (
                          <div id={`task-comments-panel-${task.id}`} className="mt-3">
                            <ul className="space-y-3 border-l-2 border-[#FDEEE7] pl-4">
                              {previews.length === 0 ? (
                                <li className="text-sm text-gray-400">
                                  Aucun commentaire pour le moment.
                                </li>
                              ) : (
                                previews.map((c) => (
                                  <li key={c.id} className="text-sm">
                                    <p className="font-medium text-[#1D1D1B]">
                                      {c.authorLabel}{' '}
                                      <span className="font-normal text-gray-400">
                                        · {formatCommentDate(c.createdAt)}
                                      </span>
                                    </p>
                                    <p className="mt-1 text-gray-600">{c.content}</p>
                                  </li>
                                ))
                              )}
                            </ul>
                            <div className="mt-4 space-y-2">
                              {commentErr[task.id] && (
                                <p className="text-sm text-red-600">{commentErr[task.id]}</p>
                              )}
                              <textarea
                                rows={2}
                                placeholder="Ajouter un commentaire…"
                                value={commentDraft[task.id] ?? ''}
                                disabled={commentBusyId === task.id}
                                onChange={(e) =>
                                  setCommentDraft((d) => ({
                                    ...d,
                                    [task.id]: e.target.value,
                                  }))
                                }
                                aria-label={`Nouveau commentaire pour ${task.title}`}
                                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1D1D1B] placeholder:text-gray-400 focus:border-[#E86B32] focus:outline-none focus:ring-1 focus:ring-[#E86B32] disabled:opacity-60"
                              />
                              <button
                                type="button"
                                disabled={
                                  commentBusyId === task.id || !(commentDraft[task.id] ?? '').trim()
                                }
                                onClick={() => void submitComment(task.id)}
                                className="rounded-lg bg-[#E86B32] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#d85e28] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {commentBusyId === task.id ? 'Envoi…' : 'Publier'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => onCreateModalOpenChange(false)}
        projectId={projectId}
        collaborators={collaborators}
        canSetTaskDeadline={canSetTaskDeadline}
        onSuccess={() => router.refresh()}
      />

      <EditTaskModal
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        projectId={projectId}
        task={editingTask}
        collaborators={collaborators}
        canSetTaskDeadline={canSetTaskDeadline}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
