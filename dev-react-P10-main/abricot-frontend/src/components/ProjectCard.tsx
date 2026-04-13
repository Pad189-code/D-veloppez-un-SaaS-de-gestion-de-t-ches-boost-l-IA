'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { initialsFromUser, teamMemberCount, type ProjectListRow } from '@/lib/projectTeam';

type ProjectCardProps = {
  project: ProjectListRow;
  /** Pourcentage d’avancement affiché sur la barre (maquette liste projets). */
  progressPercent?: number;
};

export default function ProjectCard({ project, progressPercent = 0 }: ProjectCardProps) {
  const href = `/projets/${project.id}`;
  const pct = Math.min(100, Math.max(0, Math.round(progressPercent)));
  const n = teamMemberCount(project);
  const ownerInitials = initialsFromUser(project.owner);

  return (
    <Link
      href={href}
      className="flex h-[351px] min-h-0 w-full max-w-[380px] cursor-pointer flex-col rounded-[10px] border border-[#E5E7EB] bg-white p-6 sm:w-[380px] sm:max-w-[380px] sm:p-[30px_34px] transition-all hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86B32] focus-visible:ring-offset-2"
    >
      <h3 className="mb-3 line-clamp-2 text-xl font-bold text-[#111827]">{project.name}</h3>
      <p className="mb-6 min-h-0 flex-1 overflow-hidden text-sm leading-relaxed text-[#6B7280] line-clamp-6">
        {project.description || 'Aucune description fournie.'}
      </p>

      <div className="mb-6 shrink-0">
        <div className="mb-2 flex justify-between text-xs font-medium">
          <span className="text-[#6B7280]">Progression</span>
          <span className="text-[#111827]">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
          <div
            className="h-full bg-[#E86B32] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-auto shrink-0 border-t border-[#F3F4F6] pt-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#71767C]">
          <Users size={14} className="shrink-0" aria-hidden />
          <span>Équipe ({n})</span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFEBDD] text-[10px] font-bold text-[#374151]"
              aria-hidden
            >
              {ownerInitials}
            </span>
            <span
              className="inline-flex shrink-0 rounded-full bg-[#FFEBDD] px-2.5 py-1 text-[10px] font-medium leading-none text-[#D36B3D]"
              title="Propriétaire du projet"
            >
              Propriétaire
            </span>
          </div>
          {project.collaborators.length > 0 && (
            <div className="flex items-center pl-0.5 -space-x-2 sm:pl-1">
              {project.collaborators.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#E9ECEF] text-[10px] font-bold text-[#374151]"
                  title={u.name || u.email}
                  aria-hidden
                >
                  {initialsFromUser(u)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
