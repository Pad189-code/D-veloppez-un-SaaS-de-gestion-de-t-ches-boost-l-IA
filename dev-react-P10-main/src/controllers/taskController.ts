import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateTaskRequest, UpdateTaskRequest, AuthRequest } from "../types";
import {
  validateCreateTaskData,
  validateUpdateTaskData,
} from "../utils/validation";
import {
  hasProjectAccess,
  canCreateTasks,
  canModifyTasks,
} from "../utils/permissions";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendServerError,
} from "../utils/response";
import {
  validateProjectMembers,
  getTaskAssignments,
} from "../utils/taskAssignments";
import { getTaskComments } from "../utils/taskComments";

const prisma = new PrismaClient();

const taskInclude = {
  project: {
    select: {
      id: true,
      name: true,
    },
  },
  assignees: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
} as const;

/**
 * Créer une nouvelle tâche
 * POST /projects/:projectId/tasks
 */
export const createTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const projectId = req.params.projectId || req.params.id;

    if (!projectId || typeof projectId !== "string") {
      sendError(res, "ID de projet invalide", "INVALID_PROJECT_ID", 400);
      return;
    }
    const {
      title,
      description,
      dueDate,
      assigneeIds,
    }: CreateTaskRequest = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    const validationErrors = validateCreateTaskData({
      title,
      description,
      dueDate,
      assigneeIds,
    });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données de création de tâche invalides",
        validationErrors,
      );
      return;
    }

    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      sendError(res, "Projet non trouvé", "PROJECT_NOT_FOUND", 404);
      return;
    }

    const canCreate = await canCreateTasks(authReq.user.id, projectId);
    if (!canCreate) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour créer des tâches dans ce projet",
        "FORBIDDEN",
        403,
      );
      return;
    }

    if (assigneeIds && assigneeIds.length > 0) {
      const areValidMembers = await validateProjectMembers(
        projectId,
        assigneeIds,
      );
      if (!areValidMembers) {
        sendError(
          res,
          "Certains utilisateurs assignés ne sont pas membres du projet",
          "INVALID_ASSIGNEES",
          400,
        );
        return;
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        ...(assigneeIds?.length
          ? {
              assignees: {
                connect: assigneeIds.map((uid) => ({ id: uid })),
              },
            }
          : {}),
      },
      include: taskInclude,
    });

    const assignees = await getTaskAssignments(task.id);
    const comments = await getTaskComments(task.id);

    const taskResponse = {
      ...task,
      assignees,
      comments,
    };

    sendSuccess(res, "Tâche créée avec succès", { task: taskResponse }, 201);
  } catch (error) {
    console.error("Erreur lors de la création de la tâche:", error);
    sendServerError(res, "Erreur lors de la création de la tâche");
  }
};

/**
 * @swagger
 * /projects/{id}/tasks:
 *   get:
 *     summary: Récupérer toutes les tâches d'un projet
 *     description: Retourne la liste complète des tâches associées à un projet spécifique, incluant les assignations et les commentaires
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 */
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: taskInclude,
      orderBy: { createdAt: "desc" },
    });

    const tasksWithAssignments = await Promise.all(
      tasks.map(async (task) => {
        const assignees = await getTaskAssignments(task.id);
        const comments = await getTaskComments(task.id);
        return {
          ...task,
          assignees,
          comments,
        };
      }),
    );

    sendSuccess(res, "Tâches récupérées avec succès", {
      tasks: tasksWithAssignments,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    sendServerError(res, "Erreur lors de la récupération des tâches");
  }
};

/**
 * Récupérer une tâche spécifique
 * GET /projects/:projectId/tasks/:taskId
 */
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const { taskId } = req.params;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: taskInclude,
    });

    if (!task) {
      sendError(res, "Tâche non trouvée", "TASK_NOT_FOUND", 404);
      return;
    }

    const assignees = await getTaskAssignments(task.id);
    const comments = await getTaskComments(task.id);

    const taskWithAssignments = {
      ...task,
      assignees,
      comments,
    };

    sendSuccess(res, "Tâche récupérée avec succès", {
      task: taskWithAssignments,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la tâche:", error);
    sendServerError(res, "Erreur lors de la récupération de la tâche");
  }
};

/**
 * Mettre à jour une tâche
 * PUT /projects/:projectId/tasks/:taskId
 */
export const updateTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const projectId = req.params.id;
    const { taskId } = req.params;
    const {
      title,
      description,
      status,
      dueDate,
      assigneeIds,
    }: UpdateTaskRequest = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    const validationErrors = validateUpdateTaskData({
      title,
      description,
      status,
      dueDate,
      assigneeIds,
    });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données de mise à jour invalides",
        validationErrors,
      );
      return;
    }

    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    const canModify = await canModifyTasks(authReq.user.id, projectId);
    if (!canModify) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour modifier des tâches dans ce projet",
        "FORBIDDEN",
        403,
      );
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!existingTask) {
      sendError(res, "Tâche non trouvée", "TASK_NOT_FOUND", 404);
      return;
    }

    if (assigneeIds && assigneeIds.length > 0) {
      const areValidMembers = await validateProjectMembers(
        projectId,
        assigneeIds,
      );
      if (!areValidMembers) {
        sendError(
          res,
          "Certains utilisateurs assignés ne sont pas membres du projet",
          "INVALID_ASSIGNEES",
          400,
        );
        return;
      }
    }

    const updateData: {
      title?: string;
      description?: string | null;
      status?: string;
      dueDate?: Date | null;
    } = {};
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        ...updateData,
        ...(assigneeIds !== undefined && {
          assignees: {
            set: assigneeIds.map((uid) => ({ id: uid })),
          },
        }),
      },
    });

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: taskInclude,
    });

    if (!updatedTask) {
      sendError(res, "Tâche non trouvée", "TASK_NOT_FOUND", 404);
      return;
    }

    const assignees = await getTaskAssignments(taskId);
    const comments = await getTaskComments(taskId);
    const taskWithAssignments = {
      ...updatedTask,
      assignees,
      comments,
    };

    sendSuccess(res, "Tâche mise à jour avec succès", {
      task: taskWithAssignments,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la tâche:", error);
    sendServerError(res, "Erreur lors de la mise à jour de la tâche");
  }
};

/**
 * Supprimer une tâche
 * DELETE /projects/:projectId/tasks/:taskId
 */
export const deleteTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const projectId = req.params.id;
    const { taskId } = req.params;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    const hasAccess = await hasProjectAccess(authReq.user.id, projectId);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    const canModify = await canModifyTasks(authReq.user.id, projectId);
    if (!canModify) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour supprimer des tâches dans ce projet",
        "FORBIDDEN",
        403,
      );
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!existingTask) {
      sendError(res, "Tâche non trouvée", "TASK_NOT_FOUND", 404);
      return;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    sendSuccess(res, "Tâche supprimée avec succès");
  } catch (error) {
    console.error("Erreur lors de la suppression de la tâche:", error);
    sendServerError(res, "Erreur lors de la suppression de la tâche");
  }
};
