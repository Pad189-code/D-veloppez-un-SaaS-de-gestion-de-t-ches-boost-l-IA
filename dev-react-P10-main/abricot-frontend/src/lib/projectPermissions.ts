import { prisma } from '@/lib/prisma';
import { getSessionPayload } from '@/lib/session';

/**
 * Identifiant utilisateur pour les actions serveur :
 * 1. Session signée (cookie httpOnly `abricot_session`, secret `AUTH_SECRET` ou `JWT_SECRET`) ;
 * 2. en développement uniquement : `DEV_PROJECT_OWNER_ID` puis dernier compte créé (tests sans login).
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSessionPayload();
  if (session) {
    // Cookie encore valide mais compte supprimé en base : on ignore la session.
    const exists = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true },
    });
    if (exists) return session.userId;
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const envId = process.env.DEV_PROJECT_OWNER_ID?.trim();
  if (envId) {
    const byEnv = await prisma.user.findUnique({
      where: { id: envId },
      select: { id: true },
    });
    if (byEnv) return byEnv.id;
  }

  const latest = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return latest?.id ?? null;
}

/**
 * Accès au projet : propriétaire ou collaborateur (CONTRIBUTOR ou ADMIN).
 * Permet de consulter le projet et de gérer les tâches (hors échéances si non admin — voir `canModifyProject`).
 */
export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: { userId },
          },
        },
      ],
    },
    select: { id: true },
  });
  return !!project;
}

/**
 * Administrateur de projet : propriétaire **ou** collaborateur avec le rôle `ADMIN`.
 * Autorisé à modifier les métadonnées du projet (nom, description, liste des contributeurs)
 * et les **échéances** des tâches. Les seuls contributeurs (`CONTRIBUTOR`) peuvent éditer le reste des tâches.
 */
export async function canModifyProject(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      collaborators: {
        where: { userId },
        take: 1,
        select: { role: true },
      },
    },
  });
  if (!project) return false;
  if (project.ownerId === userId) return true;
  return project.collaborators[0]?.role === 'ADMIN';
}

/** Suppression du projet : propriétaire uniquement (`canDeleteProject`). */
export async function canDeleteProject(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  return project?.ownerId === userId;
}
