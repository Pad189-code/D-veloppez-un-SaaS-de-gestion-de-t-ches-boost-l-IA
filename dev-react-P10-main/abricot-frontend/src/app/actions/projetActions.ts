'use server';

/** Mutations projets (création, invitation, suppression) et lecture pour les modales. Les droits passent par `projectPermissions`. */

import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { canDeleteProject, canModifyProject, getCurrentUserId } from '@/lib/projectPermissions';
import { expressApiGet } from '@/lib/expressApi';
import { normalizeProjectListRow, type ProjectListRow } from '@/lib/projectTeam';

export type { ProjectListRow } from '@/lib/projectTeam';

export type InviteUserOption = {
  id: string;
  email: string;
  name: string | null;
};

export async function getInviteUserOptions(): Promise<InviteUserOption[]> {
  try {
    const uid = await getCurrentUserId();
    if (!uid) return [];
    return await prisma.user.findMany({
      where: { id: { not: uid } },
      select: { id: true, email: true, name: true },
      orderBy: { email: 'asc' },
    });
  } catch {
    return [];
  }
}

export type CreateProjectInput = {
  name: string;
  description: string;
  contributorIds: string[];
};

export async function createProjectAction(input: CreateProjectInput) {
  const name = input.name.trim();
  const description = input.description.trim();

  if (name.length < 2) {
    return { error: 'Le titre doit contenir au moins 2 caractères.' };
  }
  if (!description) {
    return { error: 'La description est requise.' };
  }

  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return {
      error:
        'Aucun utilisateur en base. Créez un compte (/register) ou exécutez le script de seed.',
    };
  }

  const ids = [...new Set(input.contributorIds)].filter((id) => id && id !== ownerId);

  try {
    await prisma.$transaction(async (tx) => {
      /** Le créateur devient propriétaire (`ownerId`) : administrateur du projet par défaut. */
      const project = await tx.project.create({
        data: {
          name,
          description,
          ownerId,
        },
      });

      for (const userId of ids) {
        await tx.projectCollaborator.create({
          data: {
            projectId: project.id,
            userId,
            role: 'CONTRIBUTOR',
          },
        });
      }
    });

    revalidatePath('/projets');
    revalidatePath('/dashboard');
    return { success: true as const };
  } catch {
    return { error: 'Impossible de créer le projet.' };
  }
}

export type UpdateProjectInput = {
  projectId: string;
  name: string;
  description: string;
  contributorIds: string[];
};

export async function updateProjectAction(input: UpdateProjectInput) {
  const name = input.name.trim();
  const description = input.description.trim();

  if (name.length < 2) {
    return { error: 'Le titre doit contenir au moins 2 caractères.' };
  }
  if (!description) {
    return { error: 'La description est requise.' };
  }

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { id: true, ownerId: true },
  });
  if (!project) {
    return { error: 'Projet introuvable.' };
  }

  const uid = await getCurrentUserId();
  if (!uid) {
    return { error: 'Utilisateur introuvable.' };
  }

  const allowed = await canModifyProject(uid, input.projectId);
  if (!allowed) {
    return {
      error: 'Vous n’avez pas les droits pour modifier ce projet.',
    };
  }

  const ids = [...new Set(input.contributorIds)].filter((id) => id && id !== project.ownerId);

  try {
    const existing = await prisma.projectCollaborator.findMany({
      where: { projectId: input.projectId },
      select: { userId: true, role: true },
    });
    const roleByUser = new Map(existing.map((c) => [c.userId, c.role]));

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: input.projectId },
        data: { name, description },
      });

      await tx.projectCollaborator.deleteMany({
        where: { projectId: input.projectId },
      });

      for (const userId of ids) {
        const role =
          (roleByUser.get(userId) as 'ADMIN' | 'CONTRIBUTOR' | undefined) ?? 'CONTRIBUTOR';
        await tx.projectCollaborator.create({
          data: {
            projectId: input.projectId,
            userId,
            role,
          },
        });
      }
    });

    revalidatePath('/projets');
    revalidatePath(`/projets/${input.projectId}`);
    revalidatePath('/dashboard');
    return { success: true as const };
  } catch {
    return { error: 'Impossible de mettre à jour le projet.' };
  }
}

export async function deleteProjectAction(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    return { error: 'Projet introuvable.' };
  }

  const uid = await getCurrentUserId();
  if (!uid) {
    return { error: 'Utilisateur introuvable.' };
  }

  const allowed = await canDeleteProject(uid, projectId);
  if (!allowed) {
    return {
      error: 'Seul le propriétaire du projet peut le supprimer.',
    };
  }

  try {
    await prisma.project.delete({
      where: { id: projectId },
    });
    revalidatePath('/projets');
    revalidatePath('/dashboard');
    return { success: true as const };
  } catch {
    return { error: 'Impossible de supprimer le projet.' };
  }
}

/** Élément renvoyé par `GET /projects` (API Express, propriétaire + collaborateurs). */
type ExpressProjectRaw = {
  id: string;
  name: string;
  description?: string | null;
  owner?: { id: string; name: string | null; email: string };
  collaborators?: Array<{ user: { id: string; name: string | null; email: string } }>;
};

type ExpressProjectsData = { projects: ExpressProjectRaw[] };

function mapExpressProject(p: ExpressProjectRaw): ProjectListRow {
  return normalizeProjectListRow(p.id, p.name, p.description ?? null, p.owner, p.collaborators);
}

/** Même requête que Prisma Studio / SQLite — utilisée si l’API Express ne répond pas ou refuse le JWT. */
async function getProjectsFromPrisma(): Promise<ProjectListRow[]> {
  try {
    const uid = await getCurrentUserId();
    if (!uid) return [];
    const rows = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: uid },
          {
            collaborators: {
              some: { userId: uid },
            },
          },
        ],
      },
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
    return rows.map((r) =>
      normalizeProjectListRow(r.id, r.name, r.description, r.owner, r.collaborators),
    );
  } catch {
    return [];
  }
}

/**
 * Liste des projets : **GET /projects** (API Express) si possible ; sinon repli **Prisma** (même base que Prisma Studio).
 */
export async function getProjects(): Promise<ProjectListRow[]> {
  const r = await expressApiGet<ExpressProjectsData>('/projects');
  if (r.ok) {
    return r.data.projects.map(mapExpressProject);
  }
  return getProjectsFromPrisma();
}
