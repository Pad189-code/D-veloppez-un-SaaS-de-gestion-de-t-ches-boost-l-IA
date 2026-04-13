'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Sparkles, Trash2, X } from 'lucide-react';
import { previewTasksFromAiPrompt, commitAiTaskDrafts } from '@/app/actions/taskActions';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';

type DraftRow = { id: string; title: string; description: string };

function createDraftRowId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function mapToRows(tasks: { title: string; description: string }[]): DraftRow[] {
  return tasks.map((t) => ({
    id: createDraftRowId(),
    title: t.title,
    description: t.description,
  }));
}

const PLACEHOLDER = 'Décrivez les tâches que vous souhaitez ajouter...';

type AiTaskGenerationFlowProps = {
  projectId: string;
  /** Bouton compact orange « IA » (maquette projet) */
  variant?: 'default' | 'figma';
};

export default function AiTaskGenerationFlow({
  projectId,
  variant = 'default',
}: AiTaskGenerationFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<'closed' | 'prompt' | 'review'>('closed');
  const [promptText, setPromptText] = useState('');
  const [footerPrompt, setFooterPrompt] = useState('');
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingFooter, setLoadingFooter] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Titres des tâches projet utilisés comme contexte RAG pour la dernière génération */
  const [ragContextTitles, setRagContextTitles] = useState<string[]>([]);

  const promptModalRef = useModalFocusTrap(step === 'prompt');
  const reviewModalRef = useModalFocusTrap(step === 'review');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step === 'prompt') setStep('closed');
        if (step === 'review') {
          setStep('closed');
          setDrafts([]);
          setRagContextTitles([]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const openPrompt = () => {
    setPromptText('');
    setError(null);
    setRagContextTitles([]);
    setStep('prompt');
  };

  const submitPrompt = async () => {
    const text = promptText.trim();
    if (text.length < 3) {
      setError('Précisez votre demande (au moins 3 caractères).');
      return;
    }
    setLoadingPreview(true);
    setError(null);
    const res = await previewTasksFromAiPrompt(projectId, text);
    setLoadingPreview(false);
    if (!('success' in res) || !res.success) {
      setError('error' in res ? res.error : 'Erreur de génération.');
      return;
    }
    setDrafts(mapToRows(res.tasks));
    setRagContextTitles(res.ragContextTitles);
    setStep('review');
    setPromptText('');
    setFooterPrompt('');
  };

  const submitFooterPrompt = async () => {
    const text = footerPrompt.trim();
    if (text.length < 3) return;
    setLoadingFooter(true);
    setError(null);
    const res = await previewTasksFromAiPrompt(projectId, text);
    setLoadingFooter(false);
    if (!('success' in res) || !res.success) {
      setError('error' in res ? res.error : 'Erreur de génération.');
      return;
    }
    setDrafts((prev) => [...prev, ...mapToRows(res.tasks)]);
    setRagContextTitles(res.ragContextTitles);
    setFooterPrompt('');
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDraft = (id: string, field: 'title' | 'description', value: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const commit = async () => {
    if (drafts.length === 0) {
      setError('Ajoutez au moins une tâche.');
      return;
    }
    setLoadingCommit(true);
    setError(null);
    const res = await commitAiTaskDrafts(
      projectId,
      drafts.map((d) => ({ title: d.title, description: d.description })),
    );
    setLoadingCommit(false);
    if (!('success' in res) || !res.success) {
      setError('error' in res ? res.error : 'Enregistrement impossible.');
      return;
    }
    setStep('closed');
    setDrafts([]);
    setRagContextTitles([]);
    router.refresh();
  };

  const closeAll = () => {
    setStep('closed');
    setDrafts([]);
    setRagContextTitles([]);
    setError(null);
    setPromptText('');
    setFooterPrompt('');
  };

  const isFigma = variant === 'figma';

  return (
    <div className={`flex flex-col gap-2 ${isFigma ? 'items-stretch' : 'items-end'}`}>
      <button
        type="button"
        onClick={openPrompt}
        className={`relative z-40 flex items-center justify-center gap-2 rounded-lg bg-[#E86B32] font-semibold text-white transition-all hover:bg-[#d45a2a] ${
          isFigma ? 'min-h-[42px] min-w-[52px] px-5 py-2.5' : 'px-4 py-2'
        }`}
      >
        <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        {isFigma ? 'IA' : 'Créer une tâche (IA)'}
      </button>

      {/* Modale 1 — Saisie IA (598px ; zone centrale 494×523 sans contour visible) */}
      {step === 'prompt' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#C4C4C4]/35 p-4"
          onClick={closeAll}
          role="presentation"
        >
          <div
            ref={promptModalRef}
            tabIndex={-1}
            className="ai-prompt-modal box-border relative flex h-[min(799px,calc(100vh-32px))] w-full max-w-[598px] flex-col overflow-hidden rounded-[10px] border border-[#E0E0E0] bg-white px-[52px] pb-[79px] pt-[79px] shadow-none outline-none sm:h-[799px] sm:w-[598px] sm:max-w-[598px] max-sm:px-4 max-sm:pb-10 max-sm:pt-10"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-prompt-title"
            aria-describedby={error ? 'ai-prompt-error' : undefined}
          >
            <div className="mb-4 flex shrink-0 justify-end">
              <button
                type="button"
                onClick={closeAll}
                className="rounded-md p-1 text-[#9CA3AF] transition-colors hover:bg-neutral-100 hover:text-[#6B7280]"
                aria-label="Fermer"
              >
                <X size={22} strokeWidth={2} />
              </button>
            </div>

            {/* Zone de mise en page 494×523 : invisible (pas de bordure ni fond distinct) */}
            <div className="mx-auto flex h-[min(523px,calc(100vh-280px))] w-[494px] max-w-full shrink-0 flex-col border-0 bg-transparent sm:h-[523px]">
              <div className="flex shrink-0 items-center gap-2 px-0 pb-3 pt-0">
                <Sparkles className="h-6 w-6 shrink-0 text-[#E86B32]" strokeWidth={2} aria-hidden />
                <h2 id="ai-prompt-title" className="text-xl font-bold leading-tight text-black">
                  Créer une tâche
                </h2>
              </div>
              <div className="min-h-0 flex-1 bg-transparent" aria-hidden />
            </div>

            <div className="mx-auto mt-6 w-[494px] max-w-full shrink-0">
              {error && (
                <p id="ai-prompt-error" className="mb-3 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <div className="relative flex items-center rounded-full bg-[#F3F4F6] py-1.5 pl-4 pr-1.5 sm:pl-5">
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void submitPrompt();
                  }}
                  placeholder={PLACEHOLDER}
                  aria-label={PLACEHOLDER}
                  className="min-h-[48px] w-full flex-1 bg-transparent text-sm text-black outline-none placeholder:text-[#9CA3AF]"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => void submitPrompt()}
                  disabled={loadingPreview}
                  aria-busy={loadingPreview}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E86B32] text-xl font-light leading-none text-white transition hover:bg-[#d45a2a] disabled:opacity-50"
                  aria-label={loadingPreview ? 'Génération en cours' : 'Générer les tâches'}
                >
                  {loadingPreview ? '…' : '+'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale 2 — Liste / validation */}
      {step === 'review' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={closeAll}
          role="presentation"
        >
          <div
            ref={reviewModalRef}
            tabIndex={-1}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl outline-none animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-review-title"
            aria-describedby={error ? 'ai-review-error' : undefined}
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <h2
                id="ai-review-title"
                className="flex items-center gap-2 pr-8 text-xl font-bold text-black"
              >
                <Sparkles className="h-6 w-6 shrink-0 text-[#E86B32]" strokeWidth={2} aria-hidden />
                Vos tâches…
              </h2>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-[#E86B32]"
                aria-label="Fermer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {ragContextTitles.length > 0 && (
                <div className="border-b border-gray-100 px-6 py-3">
                  <p className="text-xs font-medium text-gray-500">
                    Contexte projet (tâches similaires / existantes prises en compte) :
                  </p>
                  <ul className="mt-1 max-h-20 list-inside list-disc overflow-y-auto text-xs text-gray-600">
                    {ragContextTitles.map((t, i) => (
                      <li key={`${i}-${t}`}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="max-h-[42vh] space-y-4 overflow-y-auto px-6 py-5">
                {drafts.length === 0 ? (
                  <p className="text-center text-sm text-gray-400">
                    Aucune tâche dans la liste. Utilisez le champ ci-dessous pour en générer.
                  </p>
                ) : (
                  drafts.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-4 shadow-sm"
                    >
                      <input
                        type="text"
                        value={d.title}
                        onChange={(e) => updateDraft(d.id, 'title', e.target.value)}
                        className="mb-2 w-full border-0 bg-transparent text-base font-bold text-black outline-none placeholder:text-gray-500 focus:ring-0"
                        placeholder="Nom de la tâche"
                        aria-label={`Titre de la tâche, brouillon ${d.title.slice(0, 40)}`}
                      />
                      <textarea
                        value={d.description}
                        onChange={(e) => updateDraft(d.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full resize-none border-0 bg-transparent text-sm text-black outline-none placeholder:text-gray-500 focus:ring-0"
                        placeholder="Description de la tâche"
                        aria-label="Description de la tâche"
                      />
                      <div className="mt-3 flex items-center gap-2 border-t border-gray-200/80 pt-3 text-sm">
                        <button
                          type="button"
                          onClick={() => removeDraft(d.id)}
                          className="inline-flex items-center gap-1.5 text-gray-500 transition hover:text-red-600"
                        >
                          <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                          Supprimer
                        </button>
                        <span className="text-gray-300" aria-hidden>
                          |
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-gray-400">
                          <Pencil size={16} strokeWidth={1.75} aria-hidden />
                          Modifier ci-dessus
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-100 px-6 py-5">
                {error && (
                  <p id="ai-review-error" className="mb-3 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void commit()}
                  disabled={loadingCommit || drafts.length === 0}
                  aria-busy={loadingCommit}
                  className="mb-5 w-full rounded-xl bg-[#1D1D1B] py-3.5 text-center text-base font-semibold text-white shadow-md transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {loadingCommit ? 'Enregistrement…' : '+ Ajouter les tâches'}
                </button>

                <div className="relative flex items-center rounded-full bg-gray-100 pl-5 pr-2 py-1.5">
                  <input
                    type="text"
                    value={footerPrompt}
                    onChange={(e) => setFooterPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void submitFooterPrompt();
                    }}
                    placeholder={PLACEHOLDER}
                    aria-label={`${PLACEHOLDER} (complément)`}
                    className="min-h-[48px] w-full flex-1 bg-transparent text-sm text-black outline-none placeholder:text-gray-500"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => void submitFooterPrompt()}
                    disabled={loadingFooter}
                    aria-busy={loadingFooter}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E86B32] text-xl font-light text-white shadow-sm transition hover:bg-[#d45a2a] disabled:opacity-50"
                    aria-label={
                      loadingFooter ? 'Génération en cours' : 'Ajouter des suggestions de tâches'
                    }
                  >
                    {loadingFooter ? '…' : '+'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
