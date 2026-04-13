'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { createTaskAction } from '@/app/actions/taskActions';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';

export type TaskStatusValue = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type CollaboratorOption = {
  id: string;
  name: string | null;
  email: string;
};

/** Puces statut — Figma : fond pastel, bord fine à la sélection */
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

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  collaborators: CollaboratorOption[];
  /** Propriétaire ou collaborateur ADMIN : peut définir l’échéance. */
  canSetTaskDeadline?: boolean;
  onSuccess?: () => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  collaborators,
  canSetTaskDeadline = true,
  onSuccess,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatusValue>('TODO');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useModalFocusTrap(isOpen);

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
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setDueDate('');
      setStatus('TODO');
      setAssigneeIds([]);
      setAssignOpen(false);
      setError(null);
      setPending(false);
    }
  }, [isOpen]);

  const deadlineOk = canSetTaskDeadline ? dueDate.length > 0 : true;
  const canSubmit =
    title.trim().length >= 2 && description.trim().length > 0 && deadlineOk && !pending;

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const assigneeSummary =
    assigneeIds.length === 0
      ? '*Choisir un ou plusieurs collaborateurs'
      : collaborators
          .filter((c) => assigneeIds.includes(c.id))
          .map((c) => c.name?.trim() || c.email)
          .join(', ');

  /** Figma : champs une ligne, même hauteur (48px), bordure grise légère */
  const fieldClass =
    'h-12 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[15px] leading-normal text-[#1D1D1B] placeholder:text-[#9CA3AF] transition-colors focus:border-[#E86B32] focus:outline-none focus:ring-1 focus:ring-[#E86B32]/30';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    const result = await createTaskAction({
      projectId,
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#C4C4C4]/35 p-4"
      onClick={onClose}
      role="presentation"
    >
      {/* Figma : 598×799 Hug — largeur fixe, hauteur cible 799px ; scroll seulement si la fenêtre est trop basse */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="create-task-modal box-border flex h-[min(799px,calc(100vh-32px))] w-full max-w-[598px] flex-col overflow-y-auto rounded-[10px] border border-[#E0E0E0] bg-white px-[73px] pb-[79px] pt-[79px] shadow-none outline-none sm:h-[799px] sm:w-[598px] sm:max-w-[598px] max-sm:px-5 max-sm:pb-10 max-sm:pt-10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-task-title"
        aria-describedby={error ? 'create-task-error' : undefined}
        aria-modal="true"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2
              id="create-task-title"
              className="text-[28px] font-bold leading-[1.2] tracking-tight text-black"
            >
              Créer une tâche
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
            <label htmlFor="task-title" className="text-sm font-semibold text-black">
              Titre*
            </label>
            <input
              id="task-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
              className={fieldClass}
              autoComplete="off"
            />
          </div>

          {/* Figma : même hauteur que le titre — une seule ligne, pas de textarea */}
          <div className="flex flex-col gap-2">
            <label htmlFor="task-description" className="text-sm font-semibold text-black">
              Description*
            </label>
            <input
              id="task-description"
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
              <label htmlFor="task-due" className="text-sm font-semibold text-black">
                Échéance*
              </label>
              <div className="relative">
                <input
                  id="task-due"
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
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-black">Échéance : </span>
              réservée aux administrateurs du projet (propriétaire ou rôle admin).
            </p>
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
            <p id="create-task-error" className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Figma : bouton aligné à gauche, gris clair + texte gris (état formulaire vide) ; noir quand valide */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="self-start rounded-xl px-10 py-3.5 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#6B7280] enabled:bg-[#1D1D1B] enabled:text-white enabled:hover:bg-black"
          >
            + Ajouter une tâche
          </button>
        </form>
      </div>
    </div>
  );
}
