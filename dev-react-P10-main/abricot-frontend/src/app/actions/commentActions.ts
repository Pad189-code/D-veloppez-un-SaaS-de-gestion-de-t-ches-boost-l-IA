'use server';

/** Commentaires sur les tâches : vérifie l’accès projet avant écriture. */

import { prisma } from '@/lib/prisma';
import { getCurrentUserId, hasProjectAccess } from '@/lib/projectPermissions';
import { revalidatePath } from 'next/cache';

export async function addTaskCommentAction(input: {
  projectId: string;
  taskId: string;
  content: string;
}): Promise<{ success: true } | { error: string }> {
  const content = input.content.trim();
  if (content.length < 1) {
    return { error: 'Le commentaire ne peut pas être vide.' };
  }
  if (content.length > 4000) {
    return { error: 'Le commentaire est trop long (4000 caractères max).' };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: 'Utilisateur non identifié.' };
  }

  const canAccess = await hasProjectAccess(userId, input.projectId);
  if (!canAccess) {
    return { error: 'Accès refusé à ce projet.' };
  }

  const task = await prisma.task.findFirst({
    where: {
      id: input.taskId,
      projectId: input.projectId,
    },
    select: { id: true },
  });
  if (!task) {
    return { error: 'Tâche introuvable.' };
  }

  await prisma.comment.create({
    data: {
      content,
      taskId: input.taskId,
      authorId: userId,
    },
  });

  revalidatePath(`/projets/${input.projectId}`);
  return { success: true };
}
