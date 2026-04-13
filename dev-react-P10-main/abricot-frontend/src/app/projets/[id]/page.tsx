import type { ReactNode } from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/projectPermissions';
import AppShellHeader from '@/components/layout/AppShellHeader';
import AppShellFooter from '@/components/layout/AppShellFooter';
import ProjectDetailView from '@/components/project/ProjectDetailView';
import type { ProjectMemberChip } from '@/components/project/ProjectContributorsBar';
import { sortProjectTasksByUrgency } from '@/lib/projectTaskSort';
import Link from 'next/link';

export default async function ProjetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          createdAt: true,
          assignees: {
            select: { id: true, email: true, name: true },
          },
          _count: { select: { comments: true } },
          comments: {
            orderBy: { createdAt: 'asc' },
            take: 12,
            select: {
              id: true,
              content: true,
              createdAt: true,
              author: { select: { name: true, email: true } },
            },
          },
        },
      },
      collaborators: {
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
      owner: { select: { id: true, email: true, name: true } },
    },
  });

  const shell = (children: ReactNode) => (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <AppShellHeader active="projets" />
      {children}
      <AppShellFooter />
    </div>
  );

  if (!project) {
    return shell(
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Projet introuvable</h1>
        <Link href="/projets" className="mt-4 font-medium text-[#E86B32] underline">
          Retour aux projets
        </Link>
      </div>,
    );
  }

  const uid = await getCurrentUserId();
  if (!uid) {
    return shell(
      <div className="mx-auto max-w-lg flex-1 p-8 text-center">
        <h1 className="text-2xl font-bold text-[#1D1D1B]">Aucun utilisateur</h1>
        <p className="mt-3 text-gray-600">
          Créez un compte ou exécutez le script de seed pour accéder aux projets.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-block font-medium text-[#E86B32] underline underline-offset-2"
        >
          S&apos;inscrire
        </Link>
      </div>,
    );
  }

  const myCollaboration = project.collaborators.find((c) => c.userId === uid);
  const hasAccess = project.ownerId === uid || !!myCollaboration;

  if (!hasAccess) {
    return shell(
      <div className="mx-auto max-w-lg flex-1 p-8 text-center">
        <h1 className="text-2xl font-bold text-[#B91C1C]">Accès refusé</h1>
        <p className="mt-3 text-gray-600">Vous n&apos;avez pas accès à ce projet.</p>
        <Link
          href="/projets"
          className="mt-6 inline-block font-medium text-[#E86B32] underline underline-offset-2"
        >
          Retour à la liste des projets
        </Link>
      </div>,
    );
  }

  const canEditProject = project.ownerId === uid || myCollaboration?.role === 'ADMIN';

  const seen = new Set<string>();
  const collaboratorOptions: { id: string; name: string | null; email: string }[] = [];
  const pushUser = (u: { id: string; name: string | null; email: string }) => {
    if (seen.has(u.id)) return;
    seen.add(u.id);
    collaboratorOptions.push({ id: u.id, name: u.name, email: u.email });
  };
  pushUser(project.owner);
  for (const c of project.collaborators) {
    pushUser(c.user);
  }

  const members: ProjectMemberChip[] = [];
  const memberIds = new Set<string>();
  members.push({
    id: project.owner.id,
    name: project.owner.name,
    email: project.owner.email,
    isOwner: true,
  });
  memberIds.add(project.owner.id);
  for (const c of project.collaborators) {
    if (memberIds.has(c.user.id)) continue;
    memberIds.add(c.user.id);
    members.push({
      id: c.user.id,
      name: c.user.name,
      email: c.user.email,
      isOwner: false,
    });
  }

  const tasksPayload = project.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    assigneeIds: t.assignees.map((a) => a.id),
    assignees: t.assignees.map((a) => ({
      id: a.id,
      label: (a.name && a.name.trim()) || a.email,
    })),
    commentCount: t._count.comments,
    commentsPreview: t.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      authorLabel: (c.author.name && c.author.name.trim()) || c.author.email,
    })),
  }));

  const tasks = sortProjectTasksByUrgency(tasksPayload);

  return shell(
    <main className="flex-1">
      <ProjectDetailView
        projectId={project.id}
        projectName={project.name}
        description={project.description}
        canEditProject={canEditProject}
        initialContributorIds={project.collaborators.map((c) => c.userId)}
        members={members}
        tasks={tasks}
        collaborators={collaboratorOptions}
      />
    </main>,
  );
}
