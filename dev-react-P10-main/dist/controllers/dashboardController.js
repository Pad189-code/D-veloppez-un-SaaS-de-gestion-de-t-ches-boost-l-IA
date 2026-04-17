"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.getProjectsWithTasks = exports.getAssignedTasks = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const prisma = new client_1.PrismaClient();
const getAssignedTasks = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
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
        (0, response_1.sendSuccess)(res, "Tâches assignées récupérées", { tasks });
    }
    catch (error) {
        console.error("Erreur lors de la récupération des tâches assignées:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la récupération des tâches assignées");
    }
};
exports.getAssignedTasks = getAssignedTasks;
const getProjectsWithTasks = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
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
        (0, response_1.sendSuccess)(res, "Projets avec tâches récupérés", { projects });
    }
    catch (error) {
        console.error("Erreur lors de la récupération des projets avec tâches:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la récupération des projets avec tâches");
    }
};
exports.getProjectsWithTasks = getProjectsWithTasks;
const getDashboardStats = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
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
                byStatus: tasksByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {}),
            },
            projects: {
                total: projectsCount,
            },
        };
        (0, response_1.sendSuccess)(res, "Statistiques du tableau de bord récupérées", { stats });
    }
    catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la récupération des statistiques");
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboardController.js.map