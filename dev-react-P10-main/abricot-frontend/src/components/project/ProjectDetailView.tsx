'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProjectEditTrigger from '@/components/ProjectEditTrigger';
import AiTaskGenerationFlow from '@/components/AiTaskGenerationFlow';
import ProjectContributorsBar, {
  type ProjectMemberChip,
} from '@/components/project/ProjectContributorsBar';
import ProjectTasksSection from '@/components/ProjectTasksSection';
import type { TaskCardModel } from '@/types/task';
import type { CollaboratorOption } from '@/components/CreateTaskModal';

type Props = {
  projectId: string;
  projectName: string;
  description: string | null;
  /** Administrateur de projet : édition métadonnées + échéances des tâches. */
  canEditProject: boolean;
  initialContributorIds: string[];
  members: ProjectMemberChip[];
  tasks: TaskCardModel[];
  collaborators: CollaboratorOption[];
};

export default function ProjectDetailView({
  projectId,
  projectName,
  description,
  canEditProject,
  initialContributorIds,
  members,
  tasks,
  collaborators,
}: Props) {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 xl:px-[100px]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <Link
          href="/projets"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-[#E86B32]/30 hover:text-[#E86B32]"
          aria-label="Retour aux projets"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              {/* Figma : titre + lien « Modifier » orange souligné, alignés sur la même ligne */}
              <div className="inline-flex max-w-full flex-wrap items-baseline gap-x-4 gap-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#1D1D1B] md:text-4xl">
                  {projectName}
                </h1>
                {canEditProject && (
                  <ProjectEditTrigger
                    projectId={projectId}
                    initialName={projectName}
                    initialDescription={description ?? ''}
                    initialContributorIds={initialContributorIds}
                    canEdit={canEditProject}
                    canDelete={false}
                    variant="link"
                    showDeleteWhenLink={false}
                  />
                )}
              </div>
              <p className="mt-2 text-base leading-relaxed text-gray-500">
                {description || 'Aucune description fournie.'}
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-stretch gap-3 pt-1 sm:w-auto sm:items-center">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="rounded-lg bg-[#1D1D1B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
              >
                Créer une tâche
              </button>
              <AiTaskGenerationFlow projectId={projectId} variant="figma" />
            </div>
          </div>
        </div>
      </div>

      <ProjectContributorsBar members={members} />

      <div className="mt-8">
        <ProjectTasksSection
          projectId={projectId}
          tasks={tasks}
          collaborators={collaborators}
          canSetTaskDeadline={canEditProject}
          createModalOpen={createModalOpen}
          onCreateModalOpenChange={setCreateModalOpen}
        />
      </div>
    </div>
  );
}
