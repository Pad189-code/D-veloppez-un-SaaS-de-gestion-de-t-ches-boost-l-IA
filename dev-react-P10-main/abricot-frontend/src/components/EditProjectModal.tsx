'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  getInviteUserOptions,
  updateProjectAction,
  type InviteUserOption,
} from '@/app/actions/projetActions';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';

export type EditProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initialName: string;
  initialDescription: string;
  initialContributorIds: string[];
  onSuccess?: () => void;
};

export default function EditProjectModal({
  isOpen,
  onClose,
  projectId,
  initialName,
  initialDescription,
  initialContributorIds,
  onSuccess,
}: EditProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributorIds, setContributorIds] = useState<string[]>([]);
  const [users, setUsers] = useState<InviteUserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDropdownOpen(false);
      setError(null);
      setPending(false);
      return;
    }

    setName(initialName);
    setDescription(initialDescription);
    setContributorIds([...initialContributorIds]);

    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      const list = await getInviteUserOptions();
      if (!cancelled) {
        setUsers(list);
        setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, projectId, initialName, initialDescription, initialContributorIds]);

  const canSubmit = name.trim().length >= 2 && description.trim().length > 0 && !pending;

  /** Aligné sur Créer un projet / Figma : champs 48px, une ligne pour la description */
  const fieldClass =
    'h-12 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 text-[15px] leading-normal text-[#1D1D1B] placeholder:text-[#9CA3AF] transition-colors focus:border-[#E86B32] focus:outline-none focus:ring-1 focus:ring-[#E86B32]/30';

  const toggleContributor = (id: string) => {
    setContributorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const contributorSummary =
    contributorIds.length === 0
      ? 'Choisir un ou plusieurs collaborateurs'
      : contributorIds.length <= 2
        ? users
            .filter((u) => contributorIds.includes(u.id))
            .map((u) => u.name?.trim() || u.email)
            .join(', ')
        : `${contributorIds.length} collaborateurs`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    const result = await updateProjectAction({
      projectId,
      name,
      description,
      contributorIds,
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
      {/* Figma : 598×616 px — pas de scroll sur le panneau (liste contributeurs peut défiler seule) */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="edit-project-modal box-border relative flex min-h-0 h-[min(616px,calc(100vh-32px))] w-full max-w-[598px] flex-col rounded-[10px] border border-[#E0E0E0] bg-white px-[73px] pb-[79px] pt-[79px] shadow-none outline-none sm:h-[616px] sm:w-[598px] sm:max-w-[598px] max-sm:px-5 max-sm:pb-10 max-sm:pt-10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="edit-project-title"
        aria-describedby={error ? 'edit-project-error' : undefined}
        aria-modal="true"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-8" noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2
              id="edit-project-title"
              className="text-[28px] font-bold leading-tight tracking-tight text-black"
            >
              Modifier un projet
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 shrink-0 rounded-md p-1 text-[#9CA3AF] transition-colors hover:bg-neutral-100 hover:text-[#6B7280]"
              aria-label="Fermer"
            >
              <X size={22} strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-project-name" className="text-sm font-medium text-black">
              Titre*
            </label>
            <input
              id="edit-project-name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet"
              autoComplete="off"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-project-description" className="text-sm font-medium text-black">
              Description*
            </label>
            <input
              id="edit-project-description"
              name="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre projet"
              autoComplete="off"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2" ref={dropdownRef}>
            <span className="text-sm font-medium text-black">Contributeurs</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => !loadingUsers && setDropdownOpen((o) => !o)}
                className={`${fieldClass} flex h-12 items-center justify-between text-left font-normal disabled:cursor-wait disabled:opacity-60`}
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                disabled={loadingUsers}
              >
                <span
                  className={
                    loadingUsers
                      ? 'text-[#1D1D1B]'
                      : contributorIds.length === 0
                        ? 'text-[#9CA3AF]'
                        : 'text-[#1D1D1B]'
                  }
                >
                  {loadingUsers ? 'Chargement…' : contributorSummary}
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-[#9CA3AF] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {dropdownOpen && !loadingUsers && users.length > 0 && (
                <ul
                  className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-36 w-full overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white py-2 shadow-md"
                  role="listbox"
                >
                  {users.map((u) => (
                    <li key={u.id} className="px-2">
                      <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={contributorIds.includes(u.id)}
                          onChange={() => toggleContributor(u.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#E86B32] focus:ring-[#E86B32]"
                        />
                        <span className="text-sm text-black">
                          {u.name?.trim() || u.email}
                          {u.name?.trim() ? (
                            <span className="ml-2 text-xs text-gray-600">{u.email}</span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              {!loadingUsers && users.length === 0 && (
                <p className="sr-only" role="status">
                  Aucun autre utilisateur disponible pour l’invitation.
                </p>
              )}
            </div>
          </div>

          {error && (
            <p
              id="edit-project-error"
              className="line-clamp-2 text-sm leading-snug text-red-600"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-auto self-start rounded-xl px-10 py-3.5 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#6B7280] enabled:bg-[#1D1D1B] enabled:text-white enabled:hover:bg-black"
          >
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}
