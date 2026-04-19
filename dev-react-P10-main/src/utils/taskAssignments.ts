import { prisma } from "../lib/prismaSingleton";

/**
 * Vérifie que chaque utilisateur est le propriétaire du projet ou un collaborateur.
 */
export const validateProjectMembers = async (
  projectId: string,
  userIds: string[],
): Promise<boolean> => {
  if (userIds.length === 0) return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      collaborators: {
        where: { userId: { in: userIds } },
        select: { userId: true },
      },
    },
  });

  if (!project) return false;

  const allowed = new Set<string>([project.ownerId]);
  for (const c of project.collaborators) {
    allowed.add(c.userId);
  }

  return userIds.every((id) => allowed.has(id));
};

export const updateTaskAssignments = async (
  taskId: string,
  assigneeIds: string[],
): Promise<void> => {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      assignees: {
        set: assigneeIds.map((userId) => ({ id: userId })),
      },
    },
  });
};

/**
 * Assignations au format attendu par les contrôleurs (liste avec objet `user`).
 */
export const getTaskAssignments = async (taskId: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return (task?.assignees ?? []).map((user) => ({
    id: user.id,
    assignedAt: null as Date | null,
    user,
  }));
};
