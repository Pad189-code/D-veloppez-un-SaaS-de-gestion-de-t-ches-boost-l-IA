'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditProjectModal from '@/components/EditProjectModal';
import { deleteProjectAction } from '@/app/actions/projetActions';

type Props = {
  projectId: string;
  initialName: string;
  initialDescription: string;
  initialContributorIds: string[];
  canEdit: boolean;
  canDelete: boolean;
  /** Maquette Figma : lien « Modifier » orange à côté du titre */
  variant?: 'default' | 'link';
  /** Avec `variant="link"`, masque « Supprimer » par défaut (maquette). */
  showDeleteWhenLink?: boolean;
};

export default function ProjectEditTrigger({
  projectId,
  initialName,
  initialDescription,
  initialContributorIds,
  canEdit,
  canDelete,
  variant = 'default',
  showDeleteWhenLink = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const ok = window.confirm(
      'Supprimer ce projet ? Toutes les tâches et données associées seront définitivement supprimées. Cette action est irréversible.',
    );
    if (!ok) return;

    setDeleting(true);
    const result = await deleteProjectAction(projectId);
    setDeleting(false);

    if ('error' in result && result.error) {
      window.alert(result.error);
      return;
    }

    router.push('/projets');
    router.refresh();
  };

  if (!canEdit && !canDelete) {
    return null;
  }

  const isLink = variant === 'link';
  const showDelete = canDelete && (!isLink || showDeleteWhenLink);

  return (
    <>
      <div
        className={
          isLink ? 'contents' : 'flex flex-wrap items-center gap-3'
        }
      >
        {canEdit && (
          <>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={
                isLink
                  ? 'shrink-0 text-sm font-semibold text-[#E86B32] underline decoration-[#E86B32] underline-offset-2 transition hover:text-[#cf5a28] hover:decoration-[#cf5a28]'
                  : 'rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-[#111827] shadow-sm transition hover:border-[#E86B32]/40 hover:bg-[#FFFBF8]'
              }
            >
              {isLink ? 'Modifier' : 'Modifier le projet'}
            </button>
            <EditProjectModal
              isOpen={open}
              onClose={() => setOpen(false)}
              projectId={projectId}
              initialName={initialName}
              initialDescription={initialDescription}
              initialContributorIds={initialContributorIds}
              onSuccess={() => router.refresh()}
            />
          </>
        )}
        {showDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={
              isLink
                ? 'text-sm font-medium text-gray-400 transition hover:text-red-600 disabled:opacity-50'
                : 'rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'
            }
            title="Supprimer le projet"
          >
            {deleting ? '…' : isLink ? 'Supprimer' : 'Supprimer le projet'}
          </button>
        )}
      </div>
    </>
  );
}
