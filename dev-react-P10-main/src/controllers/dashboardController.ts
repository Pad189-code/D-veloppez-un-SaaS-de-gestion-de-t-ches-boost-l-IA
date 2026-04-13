import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../types";
import { sendSuccess, sendError, sendServerError } from "../utils/response";

const prisma = new PrismaClient();

/**
 * @swagger
 * /dashboard/assigned-tasks:
 *   get:
 *     summary: Récupérer les tâches assignées à l'utilisateur connecté
 *     tags: [Tableau de Bord]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tâches assignées récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tasks:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Task'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getAssignedTasks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        assignees: {
          some: {
            id: authReq.user.id,
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    sendSuccess(res, "Tâches assignées récupérées", { tasks });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tâches assignées:",
      error,
    );
    sendServerError(res, "Erreur lors de la récupération des tâches assignées");
  }
};

/**
 * @swagger
 * /dashboard/projects-with-tasks:
 *   get:
 *     summary: Récupérer les projets dans lesquels l'utilisateur a des tâches assignées
 *     tags: [Tableau de Bord]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projets avec tâches récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         projects:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Project'
 *                               - type: object
 *                                 properties:
 *                                   tasks:
 *                                     type: array
 *                                     items:
 *                                       $ref: '#/components/schemas/Task'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getProjectsWithTasks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Récupérer tous les projets où l'utilisateur a des tâches assignées
    const projects = await prisma.project.findMany({
      where: {
        tasks: {
          some: {
            assignees: {
              some: {
                id: authReq.user.id,
              },
            },
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          where: {
            assignees: {
              some: {
                id: authReq.user.id,
              },
            },
          },
          include: {
            assignees: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    sendSuccess(res, "Projets avec tâches récupérés", { projects });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des projets avec tâches:",
      error,
    );
    sendServerError(
      res,
      "Erreur lors de la récupération des projets avec tâches",
    );
  }
};

/**
 * Récupérer les statistiques du tableau de bord
 * GET /dashboard/stats
 */
export const getDashboardStats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Statistiques des tâches assignées
    const assignedTasksCount = await prisma.task.count({
      where: {
        assignees: {
          some: {
            id: authReq.user.id,
          },
        },
      },
    });

    const soon = new Date();
    soon.setDate(soon.getDate() + 7);

    const urgentTasksCount = await prisma.task.count({
      where: {
        assignees: {
          some: {
            id: authReq.user.id,
          },
        },
        status: { not: "DONE" },
        dueDate: {
          not: null,
          lte: soon,
        },
      },
    });

    const overdueTasksCount = await prisma.task.count({
      where: {
        assignees: {
          some: {
            id: authReq.user.id,
          },
        },
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: "DONE",
        },
      },
    });

    const tasksByStatus = await prisma.task.groupBy({
      by: ["status"],
      where: {
        assignees: {
          some: {
            id: authReq.user.id,
          },
        },
      },
      _count: {
        status: true,
      },
    });

    // Statistiques des projets
    const projectsCount = await prisma.project.count({
      where: {
        tasks: {
          some: {
            assignees: {
              some: {
                id: authReq.user.id,
              },
            },
          },
        },
      },
    });

    const stats = {
      tasks: {
        total: assignedTasksCount,
        urgent: urgentTasksCount,
        overdue: overdueTasksCount,
        byStatus: tasksByStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      projects: {
        total: projectsCount,
      },
    };

    sendSuccess(res, "Statistiques du tableau de bord récupérées", { stats });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    sendServerError(res, "Erreur lors de la récupération des statistiques");
  }
};
