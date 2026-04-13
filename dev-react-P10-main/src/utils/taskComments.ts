import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Récupère les commentaires d'une tâche avec les détails des auteurs
 * @param taskId - ID de la tâche
 * @returns Les commentaires avec les détails des auteurs
 */
export const getTaskComments = async (taskId: string) => {
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: comment.author,
  }));
};
