'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShellHeader from '@/components/layout/AppShellHeader';
import { CREATE_PROJECT_CTA_CLASSNAME } from '@/components/layout/createProjectCtaClassName';
import AppShellFooter from '@/components/layout/AppShellFooter';
import CreateProjectModal from '../../components/CreateProjectModal';
import ProjectCard from '@/components/ProjectCard';
import { getProjects, type ProjectListRow } from '../actions/projetActions';

export default function ProjetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadProjects = async () => {
    setLoading(true);
    const data = await getProjects();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={async () => {
          await loadProjects();
          router.refresh();
        }}
      />

      <AppShellHeader active="projets" />

      <main className="flex w-full flex-grow flex-col px-4 py-8 sm:px-6 md:py-12 lg:px-10 xl:px-[100px]">
        {/* Même largeur max que la grille (1166px) : bord droit du CTA = bord droit des cartes */}
        <div className="mx-auto w-full max-w-[1166px]">
          {/* Figma : CTA à droite, aligné en haut avec le titre */}
          <div className="mb-8 flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="mb-2 text-2xl font-bold text-[#1D1D1B] sm:text-[28px] md:text-[32px]">
                Mes projets
              </h1>
              <p className="text-base text-[#6B7280] sm:text-lg">
                Gérez vos projets
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={CREATE_PROJECT_CTA_CLASSNAME}
            >
              <span className="text-base font-medium leading-none" aria-hidden>
                +
              </span>
              <span>Créer un projet</span>
            </button>
          </div>

          {/* 9 cartes (3×3) dans 1166×1091 : 3×380+2×13=1166, 3×351+2×19=1091. Au-delà : défilement vertical. */}
          <div className="w-full lg:h-[1091px] lg:overflow-x-hidden lg:overflow-y-auto">
            <div className="grid w-full auto-rows-[351px] grid-cols-1 justify-items-center gap-x-[13px] gap-y-[19px] sm:grid-cols-2 lg:grid-cols-[380px_380px_380px] lg:justify-items-stretch">
              {loading ? (
                <p className="col-span-full w-full py-20 text-center text-gray-400 sm:col-span-2 lg:col-span-3">
                  Chargement des projets...
                </p>
              ) : projects.length === 0 ? (
                <p className="col-span-full w-full py-20 text-center italic text-gray-400 sm:col-span-2 lg:col-span-3">
                  Aucun projet pour le moment.
                </p>
              ) : (
                projects.map((project) => (
                  <ProjectCard key={project.id} project={project} progressPercent={0} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <AppShellFooter />
    </div>
  );
}
