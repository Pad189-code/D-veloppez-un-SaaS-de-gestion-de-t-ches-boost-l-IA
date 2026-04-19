import { Request, Response } from "express";
import { prisma } from "../lib/prismaSingleton";
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  AddContributorRequest,
  AuthRequest,
} from "../types";
import {
  validateCreateProjectData,
  validateUpdateProjectData,
} from "../utils/validation";
import {
  hasProjectAccess,
  isProjectOwner,
  canModifyProject,
  canDeleteProject,
  canManageContributors,
  getUserProjectRole,
} from "../utils/permissions";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendServerError,
} from "../utils/response";

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Créer un nouveau projet
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom du projet
 *                 example: "Mon Projet"
 *               description:
 *                 type: string
 *                 description: Description du projet
 *                 example: "Description du projet"
 *               contributors:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: Liste des emails des contributeurs
 *                 example: ["user1@example.com", "user2@example.com"]
 *     responses:
 *       201:
 *         description: Projet créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Project'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const createProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, description, contributors }: CreateProjectRequest = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Validation des données
    const validationErrors = validateCreateProjectData({
      name,
      description,
      contributors,
    });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données de création de projet invalides",
        validationErrors,
      );
      return;
    }

    // Créer le projet
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: authReq.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Ajouter les contributeurs si fournis
    if (contributors && contributors.length > 0) {
      const contributorUsers = await prisma.user.findMany({
        where: {
          email: {
            in: contributors.map((email) => email.toLowerCase()),
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (contributorUsers.length > 0) {
        // Créer les membres un par un pour éviter les doublons
        for (const user of contributorUsers) {
          try {
            await prisma.projectCollaborator.create({
              data: {
                userId: user.id,
                projectId: project.id,
                role: "CONTRIBUTOR",
              },
            });
          } catch (error) {
            // Ignorer les erreurs de doublons
            console.log(`Utilisateur ${user.email} déjà membre du projet`);
          }
        }
      }
    }

    // Récupérer le projet avec les membres mis à jour
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    sendSuccess(
      res,
      "Projet créé avec succès",
      { project: projectWithMembers },
      201,
    );
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    sendServerError(res, "Erreur lors de la création du projet");
  }
};

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Récupérer tous les projets de l'utilisateur connecté
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des projets récupérée avec succès
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
 *                             $ref: '#/components/schemas/Project'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getProjects = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: authReq.user.id },
          {
            collaborators: {
              some: {
                userId: authReq.user.id,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Ajouter le rôle de l'utilisateur pour chaque projet
    const projectsWithRoles = await Promise.all(
      projects.map(async (project) => {
        const role = await getUserProjectRole(authReq.user!.id, project.id);
        return {
          ...project,
          userRole: role,
        };
      }),
    );

    sendSuccess(res, "Projets récupérés avec succès", {
      projects: projectsWithRoles,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    sendServerError(res, "Erreur lors de la récupération des projets");
  }
};

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Récupérer un projet par identifiant
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Projet trouvé (inclut tâches, collaborateurs, userRole)
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
 *                         project:
 *                           $ref: '#/components/schemas/Project'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé au projet
 *       404:
 *         description: Projet introuvable
 */
/**
 * Récupérer un projet spécifique
 * GET /projects/:id
 */
export const getProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Vérifier l'accès au projet
    const hasAccess = await hasProjectAccess(authReq.user.id, id);
    if (!hasAccess) {
      sendError(res, "Accès refusé au projet", "FORBIDDEN", 403);
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignees: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      sendError(res, "Projet non trouvé", "PROJECT_NOT_FOUND", 404);
      return;
    }

    // Ajouter le rôle de l'utilisateur
    const role = await getUserProjectRole(authReq.user.id, id);

    sendSuccess(res, "Projet récupéré avec succès", {
      project: { ...project, userRole: role },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    sendServerError(res, "Erreur lors de la récupération du projet");
  }
};

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Mettre à jour un projet (propriétaire ou admin projet)
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Projet mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
/**
 * Mettre à jour un projet
 * PUT /projects/:id
 */
export const updateProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description }: UpdateProjectRequest = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Validation des données
    const validationErrors = validateUpdateProjectData({ name, description });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données de mise à jour invalides",
        validationErrors,
      );
      return;
    }

    // Vérifier les permissions
    const canModify = await canModifyProject(authReq.user.id, id);
    if (!canModify) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour modifier ce projet",
        "FORBIDDEN",
        403,
      );
      return;
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    sendSuccess(res, "Projet mis à jour avec succès", {
      project: updatedProject,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error);
    sendServerError(res, "Erreur lors de la mise à jour du projet");
  }
};

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Supprimer un projet (propriétaire uniquement)
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Projet supprimé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Seul le propriétaire peut supprimer
 */
/**
 * Supprimer un projet
 * DELETE /projects/:id
 */
export const deleteProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Vérifier les permissions
    const canDelete = await canDeleteProject(authReq.user.id, id);
    if (!canDelete) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour supprimer ce projet",
        "FORBIDDEN",
        403,
      );
      return;
    }

    // Supprimer le projet (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.project.delete({
      where: { id },
    });

    sendSuccess(res, "Projet supprimé avec succès");
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    sendServerError(res, "Erreur lors de la suppression du projet");
  }
};

/**
 * @swagger
 * /projects/{id}/contributors:
 *   post:
 *     summary: Ajouter un contributeur au projet
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [ADMIN, CONTRIBUTOR]
 *                 default: CONTRIBUTOR
 *     responses:
 *       200:
 *         description: Contributeur ajouté
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Droits de gestion des membres requis
 *       404:
 *         description: Projet ou utilisateur introuvable
 *       409:
 *         description: Déjà membre ou conflit métier
 */
/**
 * Ajouter un contributeur à un projet
 * POST /projects/:id/contributors
 */
export const addContributor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role = "CONTRIBUTOR" }: AddContributorRequest = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    const canManage = await canManageContributors(authReq.user.id, id);
    if (!canManage) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour gérer les contributeurs de ce projet",
        "FORBIDDEN",
        403,
      );
      return;
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      sendError(res, "Projet non trouvé", "PROJECT_NOT_FOUND", 404);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      sendError(res, "Utilisateur non trouvé", "USER_NOT_FOUND", 404);
      return;
    }

    if (user.id === project.ownerId) {
      sendError(
        res,
        "Le propriétaire du projet est déjà membre du projet",
        "USER_ALREADY_MEMBER",
        409,
      );
      return;
    }

    const existingMember = await prisma.projectCollaborator.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: id,
        },
      },
    });

    if (existingMember) {
      sendError(
        res,
        "L'utilisateur est déjà membre de ce projet",
        "USER_ALREADY_MEMBER",
        409,
      );
      return;
    }

    await prisma.projectCollaborator.create({
      data: {
        userId: user.id,
        projectId: id,
        role: role as "ADMIN" | "CONTRIBUTOR",
      },
    });

    sendSuccess(res, "Contributeur ajouté avec succès");
  } catch (error) {
    console.error("Erreur lors de l'ajout du contributeur:", error);
    sendServerError(res, "Erreur lors de l'ajout du contributeur");
  }
};

/**
 * @swagger
 * /projects/{id}/contributors/{userId}:
 *   delete:
 *     summary: Retirer un contributeur du projet
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contributeur retiré
 *       400:
 *         description: Impossible de retirer le propriétaire
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Droits insuffisants
 *       404:
 *         description: Projet introuvable
 */
/**
 * Retirer un contributeur d'un projet
 * DELETE /projects/:id/contributors/:userId
 */
export const removeContributor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id, userId } = req.params;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    const canManage = await canManageContributors(authReq.user.id, id);
    if (!canManage) {
      sendError(
        res,
        "Vous n'avez pas les permissions pour gérer les contributeurs de ce projet",
        "FORBIDDEN",
        403,
      );
      return;
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      sendError(res, "Projet non trouvé", "PROJECT_NOT_FOUND", 404);
      return;
    }

    if (userId === project.ownerId) {
      sendError(
        res,
        "Le propriétaire du projet ne peut pas être retiré des membres",
        "CANNOT_REMOVE_OWNER",
        400,
      );
      return;
    }

    const isOwner = await isProjectOwner(authReq.user.id, id);
    if (isOwner && authReq.user.id === userId) {
      sendError(
        res,
        "Le propriétaire du projet ne peut pas se retirer",
        "CANNOT_REMOVE_OWNER",
        400,
      );
      return;
    }

    await prisma.projectCollaborator.deleteMany({
      where: {
        userId,
        projectId: id,
      },
    });

    sendSuccess(res, "Contributeur retiré avec succès");
  } catch (error) {
    console.error("Erreur lors du retrait du contributeur:", error);
    sendServerError(res, "Erreur lors du retrait du contributeur");
  }
};

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Rechercher des utilisateurs pour l'autocomplete
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Terme de recherche (nom ou email)
 *         example: "alice"
 *     responses:
 *       200:
 *         description: Utilisateurs trouvés avec succès
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
 *                         users:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *       400:
 *         description: Paramètre de recherche invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const searchUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { query } = req.query;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    if (!query || typeof query !== "string") {
      sendError(res, "Paramètre de recherche requis", "MISSING_QUERY", 400);
      return;
    }

    const searchQuery = query.trim();
    if (searchQuery.length < 2) {
      sendError(
        res,
        "La recherche doit contenir au moins 2 caractères",
        "INVALID_QUERY",
        400,
      );
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              contains: searchQuery,
            },
          },
          {
            name: {
              contains: searchQuery,
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 10, // Limiter à 10 résultats
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });

    sendSuccess(res, "Utilisateurs trouvés", { users });
  } catch (error) {
    console.error("Erreur lors de la recherche d'utilisateurs:", error);
    sendServerError(res, "Erreur lors de la recherche d'utilisateurs");
  }
};
