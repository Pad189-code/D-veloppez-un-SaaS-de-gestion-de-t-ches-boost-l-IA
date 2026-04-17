"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.getComment = exports.getComments = exports.createComment = void 0;
const client_1 = require("@prisma/client");
const validation_1 = require("../utils/validation");
const permissions_1 = require("../utils/permissions");
const response_1 = require("../utils/response");
const prisma = new client_1.PrismaClient();
const createComment = async (req, res) => {
    try {
        const projectId = req.params.id || req.params.projectId;
        const { taskId } = req.params;
        console.log("Paramètres reçus dans createComment:", req.params);
        console.log("projectId:", projectId, "taskId:", taskId);
        const { content } = req.body;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const validationErrors = (0, validation_1.validateCreateCommentData)({ content });
        if (validationErrors.length > 0) {
            (0, response_1.sendValidationError)(res, "Données de création de commentaire invalides", validationErrors);
            return;
        }
        const hasAccess = await (0, permissions_1.hasProjectAccess)(authReq.user.id, projectId);
        if (!hasAccess) {
            (0, response_1.sendError)(res, "Accès refusé au projet", "FORBIDDEN", 403);
            return;
        }
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
        });
        if (!task) {
            (0, response_1.sendError)(res, "Tâche non trouvée", "TASK_NOT_FOUND", 404);
            return;
        }
        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                taskId,
                authorId: authReq.user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        (0, response_1.sendSuccess)(res, "Commentaire créé avec succès", { comment }, 201);
    }
    catch (error) {
        console.error("Erreur lors de la création du commentaire:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la création du commentaire");
    }
};
exports.createComment = createComment;
const getComments = async (req, res) => {
    try {
        const projectId = req.params.id || req.params.projectId;
        const { taskId } = req.params;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const hasAccess = await (0, permissions_1.hasProjectAccess)(authReq.user.id, projectId);
        if (!hasAccess) {
            (0, response_1.sendError)(res, "Accès refusé au projet", "FORBIDDEN", 403);
            return;
        }
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
        });
        if (!task) {
            (0, response_1.sendError)(res, "Tâche non trouvée", "TASK_NOT_FOUND", 404);
            return;
        }
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
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });
        (0, response_1.sendSuccess)(res, "Commentaires récupérés avec succès", { comments });
    }
    catch (error) {
        console.error("Erreur lors de la récupération des commentaires:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la récupération des commentaires");
    }
};
exports.getComments = getComments;
const getComment = async (req, res) => {
    try {
        const projectId = req.params.id || req.params.projectId;
        const { taskId, commentId } = req.params;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const hasAccess = await (0, permissions_1.hasProjectAccess)(authReq.user.id, projectId);
        if (!hasAccess) {
            (0, response_1.sendError)(res, "Accès refusé au projet", "FORBIDDEN", 403);
            return;
        }
        const comment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                taskId,
                task: {
                    projectId,
                },
            },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        if (!comment) {
            (0, response_1.sendError)(res, "Commentaire non trouvé", "COMMENT_NOT_FOUND", 404);
            return;
        }
        (0, response_1.sendSuccess)(res, "Commentaire récupéré avec succès", { comment });
    }
    catch (error) {
        console.error("Erreur lors de la récupération du commentaire:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la récupération du commentaire");
    }
};
exports.getComment = getComment;
const updateComment = async (req, res) => {
    try {
        const projectId = req.params.id || req.params.projectId;
        const { taskId, commentId } = req.params;
        const { content } = req.body;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const validationErrors = (0, validation_1.validateUpdateCommentData)({ content });
        if (validationErrors.length > 0) {
            (0, response_1.sendValidationError)(res, "Données de mise à jour invalides", validationErrors);
            return;
        }
        const hasAccess = await (0, permissions_1.hasProjectAccess)(authReq.user.id, projectId);
        if (!hasAccess) {
            (0, response_1.sendError)(res, "Accès refusé au projet", "FORBIDDEN", 403);
            return;
        }
        const existingComment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                taskId,
                task: {
                    projectId,
                },
            },
        });
        if (!existingComment) {
            (0, response_1.sendError)(res, "Commentaire non trouvé", "COMMENT_NOT_FOUND", 404);
            return;
        }
        if (existingComment.authorId !== authReq.user.id) {
            (0, response_1.sendError)(res, "Vous ne pouvez modifier que vos propres commentaires", "FORBIDDEN", 403);
            return;
        }
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                content: content.trim(),
            },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        (0, response_1.sendSuccess)(res, "Commentaire mis à jour avec succès", {
            comment: updatedComment,
        });
    }
    catch (error) {
        console.error("Erreur lors de la mise à jour du commentaire:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la mise à jour du commentaire");
    }
};
exports.updateComment = updateComment;
const deleteComment = async (req, res) => {
    try {
        const projectId = req.params.id || req.params.projectId;
        const { taskId, commentId } = req.params;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const hasAccess = await (0, permissions_1.hasProjectAccess)(authReq.user.id, projectId);
        if (!hasAccess) {
            (0, response_1.sendError)(res, "Accès refusé au projet", "FORBIDDEN", 403);
            return;
        }
        const existingComment = await prisma.comment.findFirst({
            where: {
                id: commentId,
                taskId,
                task: {
                    projectId,
                },
            },
        });
        if (!existingComment) {
            (0, response_1.sendError)(res, "Commentaire non trouvé", "COMMENT_NOT_FOUND", 404);
            return;
        }
        const canModify = await (0, permissions_1.canModifyTasks)(authReq.user.id, projectId);
        if (existingComment.authorId !== authReq.user.id && !canModify) {
            (0, response_1.sendError)(res, "Vous ne pouvez supprimer que vos propres commentaires", "FORBIDDEN", 403);
            return;
        }
        await prisma.comment.delete({
            where: { id: commentId },
        });
        (0, response_1.sendSuccess)(res, "Commentaire supprimé avec succès");
    }
    catch (error) {
        console.error("Erreur lors de la suppression du commentaire:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la suppression du commentaire");
    }
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=commentController.js.map