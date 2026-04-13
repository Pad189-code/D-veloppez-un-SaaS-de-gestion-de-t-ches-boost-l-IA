'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { updateTaskAction } from '@/app/actions/taskActions';
import { formatTaskDueLabel } from '@/lib/formatTaskDue';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import type { TaskCardModel } from '@/types/task';
import type { CollaboratorOption, TaskStatusValue } from '@/components/CreateTaskModal';

/** Aligné sur CreateTaskModal (Figma) */
const STATUS_OPTIONS: { value: TaskStatusValue; label: string; activeClass: string }[] = [
  {
    value: 'TODO',
    label: 'À faire',
    activeClass: 'border border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]',
  },
  {
    value: 'IN_PROGRESS',
    label: 'En cours',
    activeClass: 'border border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]',
  },
  {
    value: 'DONE',
    label: 'Terminée',
    activeClass: 'border border-[#6EE7B7] bg-[#ECFDF5] text-[#047857]',
  },
];

function inactiveChipClass(value: TaskStatusValue): string {
  switch (value) {
    case 'TODO':
      return 'border border-transparent bg-[#FEF2F2] text-[#DC2626] hover:border-[#FECACA]';
    case 'IN_PROGRESS':
      return 'border border-transparent bg-[#FFF7ED] text-[#EA580C] hover:border-[#FED7AA]';
    case 'DONE':
      return 'border border-transparent bg-[#ECFDF5] text-[#059669] hover:border-[#A7F3D0]';
    default:
      return 'border border-transparent bg-gray-50 text-gray-600';
  }
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function normalizeStatus(status: string): TaskStatusValue {
  if (status === 'IN_PROGRESS' || status === 'DONE') return status;
  return 'TODO';
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  task: TaskCardModel | null;
  collaborators: CollaboratorOption[];
  /** Propriétaire ou collaborateur ADMIN : peut modifier l’échéance. */
  canSetTaskDeadline?: boolean;
  onSuccess?: () => void;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  projectId,
  task,
  collaborators,
  canSetTaskDeadline = true,
  onSuccess,
}: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatusValue>('TODO');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useModalFocusTrap(isOpen && task !== null);

  const fieldClass =
    'h-12 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[15px] leading-normal text-[#1D1D1B] placeholder:text-[#9CA3AF] transition-colors focus:border-[#E86B32] focus:outline-none focus:ring-1 focus:ring-[#E86B32]/30';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAssignOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setDueDate(toDateInputValue(task.dueDate));
      setStatus(normalizeStatus(task.status));
      setAssigneeIds([...task.assigneeIds]);
      setAssignOpen(false);
      setError(null);
      setPending(false);
    }
  }, [isOpen, task]);

  const deadlineOk = canSetTaskDeadline ? dueDate.length > 0 : true;
  const canSubmit =
    task !== null &&
    title.trim().length >= 2 &&
    description.trim().length > 0 &&
    deadlineOk &&
    !pending;

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const assigneeSummary = (() => {
    if (assigneeIds.length === 0) {
      return '*Choisir un ou plusieurs collaborateurs';
    }
    const picked = collaborators.filter((c) => assigneeIds.includes(c.id));
    if (assigneeIds.length >= 3) {
      return `${assigneeIds.length} collaborateurs`;
    }
    return picked.map((c) => c.name?.trim() || c.email).join(', ');
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !task) return;
    setPending(true);
    setError(null);
    const result = await updateTaskAction({
      projectId,
      taskId: task.id,
      title,
      description,
      ...(canSetTaskDeadline && dueDate ? { dueDate: new Date(dueDate).toISOString() } : {}),
      status,
      assigneeIds,
    });
    setPending(false);
    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#C4C4C4]/35 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="create-task-modal box-border flex h-[min(799px,calc(100vh-32px))] w-full max-w-[598px] flex-col overflow-y-auto rounded-[10px] border border-[#E0E0E0] bg-white px-[73px] pb-[79px] pt-[79px] shadow-none outline-none sm:h-[799px] sm:w-[598px] sm:max-w-[598px] max-sm:px-5 max-sm:pb-10 max-sm:pt-10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="edit-task-title"
        aria-describedby={error ? 'edit-task-error' : undefined}
        aria-modal="true"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2
              id="edit-task-title"
              className="text-[28px] font-bold leading-[1.2] tracking-tight text-black"
            >
              Modifier
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-[#9CA3AF] transition-colors hover:bg-neutral-100 hover:text-[#6B7280]"
              aria-label="Fermer"
            >
              <X size={22} strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-task-title-input" className="text-sm font-semibold text-black">
              Titre*
            </label>
            <input
              id="edit-task-title-input"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
              className={fieldClass}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-task-description" className="text-sm font-semibold text-black">
              Description*
            </label>
            <input
              id="edit-task-description"
              name="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la tâche"
              className={fieldClass}
              autoComplete="off"
            />
          </div>

          {canSetTaskDeadline ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-task-due" className="text-sm font-semibold text-black">
                Échéance*
              </label>
              <div className="relative">
                <input
                  id="edit-task-due"
                  name="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`${fieldClass} relative pr-12 [color-scheme:light]`}
                />
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                  aria-hidden
                >
                  <Calendar size={20} strokeWidth={1.75} />
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-black">Échéance</span>
              <p className="min-h-12 rounded-lg border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[15px] leading-normal text-[#1D1D1B]">
                {task.dueDate
                  ? formatTaskDueLabel(task.dueDate, task.status)
                  : 'Aucune échéance — réservée aux administrateurs du projet.'}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2" ref={dropdownRef}>
            <span className="text-sm font-semibold text-black">Assigné à :</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAssignOpen((o) => !o)}
                className={`${fieldClass} flex h-12 items-center justify-between text-left font-normal`}
                aria-expanded={assignOpen}
                aria-haspopup="listbox"
              >
                <span className={assigneeIds.length === 0 ? 'text-[#9CA3AF]' : 'text-[#1D1D1B]'}>
                  {assigneeSummary}
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-[#9CA3AF] transition-transform ${assignOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {assignOpen && collaborators.length > 0 && (
                <ul
                  className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[#E5E7EB] bg-white py-2 shadow-md"
                  role="listbox"
                >
                  {collaborators.map((c) => (
                    <li key={c.id} className="px-2">
                      <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={assigneeIds.includes(c.id)}
                          onChange={() => toggleAssignee(c.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#E86B32] focus:ring-[#E86B32]"
                        />
                        <span className="text-sm text-black">
                          {c.name?.trim() || c.email}
                          {c.name?.trim() ? (
                            <span className="ml-2 text-xs text-gray-600">{c.email}</span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {collaborators.length === 0 && (
              <p className="text-xs text-gray-400">
                Aucun collaborateur sur ce projet pour l’instant.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-black">Statut :</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Statut de la tâche">
              {STATUS_OPTIONS.map((opt) => {
                const selected = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setStatus(opt.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selected ? opt.activeClass : inactiveChipClass(opt.value)
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p id="edit-task-error" className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="self-start rounded-xl px-10 py-3.5 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#6B7280] enabled:bg-[#1D1D1B] enabled:text-white enabled:hover:bg-black"
          >
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}
