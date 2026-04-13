// src/components/ProjectList.tsx
import { prisma } from '@/lib/prisma';
import { normalizeProjectListRow } from '@/lib/projectTeam';
import ProjectCard from './ProjectCard';

export default async function ProjectList() {
  const rows = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      owner: { select: { id: true, name: true, email: true } },
      collaborators: {
        select: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const projects = rows.map((r) =>
    normalizeProjectListRow(r.id, r.name, r.description, r.owner, r.collaborators),
  );

  if (projects.length === 0) {
    return <p className="text-center text-gray-500 py-10">Aucun projet trouvé. Créez-en un !</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-[16px]">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
