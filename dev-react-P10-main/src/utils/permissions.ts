import { prisma } from "../lib/prismaSingleton";
import { ProjectRole } from "../types";

/**
 * Rôle effectif : propriétaire, admin de projet, contributeur, ou pas d'accès.
 * Propriétaire et collaborateurs (ADMIN / CONTRIBUTOR) ont accès aux tâches.
 */
export const getUserProjectRole = async (
  userId: string,
  projectId: string,
): Promise<ProjectRole | null> => {
  try {
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
    if (!project) return null;
    if (project.ownerId === userId) return ProjectRole.OWNER;
    const row = project.collaborators[0];
    if (!row) return null;
    return row.role === "ADMIN" ? ProjectRole.ADMIN : ProjectRole.CONTRIBUTOR;
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    return null;
  }
};

export const hasProjectAccess = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  const role = await getUserProjectRole(userId, projectId);
  return role !== null;
};

/** Propriétaire ou administrateur de projet (modifier le projet, gérer les contributeurs) */
export const isProjectAdmin = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  const role = await getUserProjectRole(userId, projectId);
  return role === ProjectRole.OWNER || role === ProjectRole.ADMIN;
};

export const isProjectOwner = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  const role = await getUserProjectRole(userId, projectId);
  return role === ProjectRole.OWNER;
};

/** Propriétaire ou admin : modifier les métadonnées du projet */
export const canModifyProject = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  return await isProjectAdmin(userId, projectId);
};

/** Propriétaire ou admin : ajouter / retirer des contributeurs */
export const canManageContributors = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  return await isProjectAdmin(userId, projectId);
};

/** Suppression du projet : propriétaire ou admin */
export const canDeleteProject = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  return await isProjectAdmin(userId, projectId);
};

/** Création de tâche : propriétaire, admin ou contributeur */
export const canCreateTasks = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  return await hasProjectAccess(userId, projectId);
};

/** Édition d'une tâche : propriétaire ou admin */
export const canEditTasks = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  return await isProjectAdmin(userId, projectId);
};

/** Suppression d'une tâche : propriétaire, admin ou contributeur */
export const canDeleteTasks = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  return await hasProjectAccess(userId, projectId);
};
