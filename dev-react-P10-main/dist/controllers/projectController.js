"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.removeContributor = exports.addContributor = exports.deleteProject = exports.updateProject = exports.getProject = exports.getProjects = exports.createProject = void 0;
const prismaSingleton_1 = require("../lib/prismaSingleton");
const validation_1 = require("../utils/validation");
const permissions_1 = require("../utils/permissions");
const response_1 = require("../utils/response");
const createProject = async (req, res) => {
    try {
        const { name, description, contributors } = req.body;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const validationErrors = (0, validation_1.validateCreateProjectData)({
            name,
            description,
            contributors,
        });
        if (validationErrors.length > 0) {
            (0, response_1.sendValidationError)(res, "Données de création de projet invalides", validationErrors);
            return;
        }
        const project = await prismaSingleton_1.prisma.project.create({
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
        if (contributors && contributors.length > 0) {
            const contributorUsers = await prismaSingleton_1.prisma.user.findMany({
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
                for (const user of contributorUsers) {
                    try {
                        await prismaSingleton_1.prisma.projectCollaborator.create({
                            data: {
                                userId: user.id,
                                projectId: project.id,
                                role: "CONTRIBUTOR",
                            },
                        });
                    }
                    catch (error) {
                        console.log(`Utilisateur ${user.email} déjà membre du projet`);
                    }
                }
            }
        }
        const projectWithMembers = await prismaSingleton_1.prisma.project.findUnique({
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
        (0, response_1.sendSuccess)(res, "Projet créé avec succès", { project: projectWithMembers }, 201);
    }
    catch (error) {
        console.error("Erreur lors de la création du projet:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la création du projet");
    }
};
exports.createProject = createProject;
const getProjects = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const projects = await prismaSingleton_1.prisma.project.findMany({
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
        const projectsWithRoles = await Promise.all(projects.map(async (project) => {
            const role = await (0, permissions_1.getUserProjectRole)(authReq.user.id, project.id);
            return {
                ...project,
                userRole: role,
            };
        }));
        (0, response_1.sendSuccess)(res, "Projets récupérés avec succès", {
            projects: projectsWithRoles,
        });
    }
    catch (error) {
        console.error("Erreur lors de la récupération des projets:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la récupération des projets");
    }
};
exports.getProjects = getProjects;
const getProject = async (req, res) => {
    try {
        const { id } = req.params;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const hasAccess = await (0, permissions_1.hasProjectAccess)(authReq.user.id, id);
        if (!hasAccess) {
            (0, response_1.sendError)(res, "Accès refusé au projet", "FORBIDDEN", 403);
            return;
        }
        const project = await prismaSingleton_1.prisma.project.findUnique({
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
            (0, response_1.sendError)(res, "Projet non trouvé", "PROJECT_NOT_FOUND", 404);
            return;
        }
        const role = await (0, permissions_1.getUserProjectRole)(authReq.user.id, id);
        (0, response_1.sendSuccess)(res, "Projet récupéré avec succès", {
            project: { ...project, userRole: role },
        });
    }
    catch (error) {
        console.error("Erreur lors de la récupération du projet:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la récupération du projet");
    }
};
exports.getProject = getProject;
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const validationErrors = (0, validation_1.validateUpdateProjectData)({ name, description });
        if (validationErrors.length > 0) {
            (0, response_1.sendValidationError)(res, "Données de mise à jour invalides", validationErrors);
            return;
        }
        const canModify = await (0, permissions_1.canModifyProject)(authReq.user.id, id);
        if (!canModify) {
            (0, response_1.sendError)(res, "Vous n'avez pas les permissions pour modifier ce projet", "FORBIDDEN", 403);
            return;
        }
        const updateData = {};
        if (name !== undefined) {
            updateData.name = name.trim();
        }
        if (description !== undefined) {
            updateData.description = description?.trim() || null;
        }
        const updatedProject = await prismaSingleton_1.prisma.project.update({
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
        (0, response_1.sendSuccess)(res, "Projet mis à jour avec succès", {
            project: updatedProject,
        });
    }
    catch (error) {
        console.error("Erreur lors de la mise à jour du projet:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la mise à jour du projet");
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const canDelete = await (0, permissions_1.canDeleteProject)(authReq.user.id, id);
        if (!canDelete) {
            (0, response_1.sendError)(res, "Vous n'avez pas les permissions pour supprimer ce projet", "FORBIDDEN", 403);
            return;
        }
        await prismaSingleton_1.prisma.project.delete({
            where: { id },
        });
        (0, response_1.sendSuccess)(res, "Projet supprimé avec succès");
    }
    catch (error) {
        console.error("Erreur lors de la suppression du projet:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la suppression du projet");
    }
};
exports.deleteProject = deleteProject;
const addContributor = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role = "CONTRIBUTOR" } = req.body;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const canManage = await (0, permissions_1.canManageContributors)(authReq.user.id, id);
        if (!canManage) {
            (0, response_1.sendError)(res, "Vous n'avez pas les permissions pour gérer les contributeurs de ce projet", "FORBIDDEN", 403);
            return;
        }
        const project = await prismaSingleton_1.prisma.project.findUnique({ where: { id } });
        if (!project) {
            (0, response_1.sendError)(res, "Projet non trouvé", "PROJECT_NOT_FOUND", 404);
            return;
        }
        const user = await prismaSingleton_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            (0, response_1.sendError)(res, "Utilisateur non trouvé", "USER_NOT_FOUND", 404);
            return;
        }
        if (user.id === project.ownerId) {
            (0, response_1.sendError)(res, "Le propriétaire du projet est déjà membre du projet", "USER_ALREADY_MEMBER", 409);
            return;
        }
        const existingMember = await prismaSingleton_1.prisma.projectCollaborator.findUnique({
            where: {
                userId_projectId: {
                    userId: user.id,
                    projectId: id,
                },
            },
        });
        if (existingMember) {
            (0, response_1.sendError)(res, "L'utilisateur est déjà membre de ce projet", "USER_ALREADY_MEMBER", 409);
            return;
        }
        await prismaSingleton_1.prisma.projectCollaborator.create({
            data: {
                userId: user.id,
                projectId: id,
                role: role,
            },
        });
        (0, response_1.sendSuccess)(res, "Contributeur ajouté avec succès");
    }
    catch (error) {
        console.error("Erreur lors de l'ajout du contributeur:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de l'ajout du contributeur");
    }
};
exports.addContributor = addContributor;
const removeContributor = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const canManage = await (0, permissions_1.canManageContributors)(authReq.user.id, id);
        if (!canManage) {
            (0, response_1.sendError)(res, "Vous n'avez pas les permissions pour gérer les contributeurs de ce projet", "FORBIDDEN", 403);
            return;
        }
        const project = await prismaSingleton_1.prisma.project.findUnique({ where: { id } });
        if (!project) {
            (0, response_1.sendError)(res, "Projet non trouvé", "PROJECT_NOT_FOUND", 404);
            return;
        }
        if (userId === project.ownerId) {
            (0, response_1.sendError)(res, "Le propriétaire du projet ne peut pas être retiré des membres", "CANNOT_REMOVE_OWNER", 400);
            return;
        }
        const isOwner = await (0, permissions_1.isProjectOwner)(authReq.user.id, id);
        if (isOwner && authReq.user.id === userId) {
            (0, response_1.sendError)(res, "Le propriétaire du projet ne peut pas se retirer", "CANNOT_REMOVE_OWNER", 400);
            return;
        }
        await prismaSingleton_1.prisma.projectCollaborator.deleteMany({
            where: {
                userId,
                projectId: id,
            },
        });
        (0, response_1.sendSuccess)(res, "Contributeur retiré avec succès");
    }
    catch (error) {
        console.error("Erreur lors du retrait du contributeur:", error);
        (0, response_1.sendServerError)(res, "Erreur lors du retrait du contributeur");
    }
};
exports.removeContributor = removeContributor;
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        if (!query || typeof query !== "string") {
            (0, response_1.sendError)(res, "Paramètre de recherche requis", "MISSING_QUERY", 400);
            return;
        }
        const searchQuery = query.trim();
        if (searchQuery.length < 2) {
            (0, response_1.sendError)(res, "La recherche doit contenir au moins 2 caractères", "INVALID_QUERY", 400);
            return;
        }
        const users = await prismaSingleton_1.prisma.user.findMany({
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
            take: 10,
            orderBy: [{ name: "asc" }, { email: "asc" }],
        });
        (0, response_1.sendSuccess)(res, "Utilisateurs trouvés", { users });
    }
    catch (error) {
        console.error("Erreur lors de la recherche d'utilisateurs:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la recherche d'utilisateurs");
    }
};
exports.searchUsers = searchUsers;
//# sourceMappingURL=projectController.js.map