"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canDeleteTasks = exports.canEditTasks = exports.canCreateTasks = exports.canDeleteProject = exports.canManageContributors = exports.canModifyProject = exports.isProjectOwner = exports.isProjectAdmin = exports.hasProjectAccess = exports.getUserProjectRole = void 0;
const prismaSingleton_1 = require("../lib/prismaSingleton");
const types_1 = require("../types");
const getUserProjectRole = async (userId, projectId) => {
    try {
        const project = await prismaSingleton_1.prisma.project.findUnique({
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
        if (!project)
            return null;
        if (project.ownerId === userId)
            return types_1.ProjectRole.OWNER;
        const row = project.collaborators[0];
        if (!row)
            return null;
        return row.role === "ADMIN" ? types_1.ProjectRole.ADMIN : types_1.ProjectRole.CONTRIBUTOR;
    }
    catch (error) {
        console.error("Erreur lors de la récupération du rôle:", error);
        return null;
    }
};
exports.getUserProjectRole = getUserProjectRole;
const hasProjectAccess = async (userId, projectId) => {
    const role = await (0, exports.getUserProjectRole)(userId, projectId);
    return role !== null;
};
exports.hasProjectAccess = hasProjectAccess;
const isProjectAdmin = async (userId, projectId) => {
    const role = await (0, exports.getUserProjectRole)(userId, projectId);
    return role === types_1.ProjectRole.OWNER || role === types_1.ProjectRole.ADMIN;
};
exports.isProjectAdmin = isProjectAdmin;
const isProjectOwner = async (userId, projectId) => {
    const role = await (0, exports.getUserProjectRole)(userId, projectId);
    return role === types_1.ProjectRole.OWNER;
};
exports.isProjectOwner = isProjectOwner;
const canModifyProject = async (userId, projectId) => {
    return await (0, exports.isProjectAdmin)(userId, projectId);
};
exports.canModifyProject = canModifyProject;
const canManageContributors = async (userId, projectId) => {
    return await (0, exports.isProjectAdmin)(userId, projectId);
};
exports.canManageContributors = canManageContributors;
const canDeleteProject = async (userId, projectId) => {
    return await (0, exports.isProjectAdmin)(userId, projectId);
};
exports.canDeleteProject = canDeleteProject;
const canCreateTasks = async (userId, projectId) => {
    return await (0, exports.hasProjectAccess)(userId, projectId);
};
exports.canCreateTasks = canCreateTasks;
const canEditTasks = async (userId, projectId) => {
    return await (0, exports.isProjectAdmin)(userId, projectId);
};
exports.canEditTasks = canEditTasks;
const canDeleteTasks = async (userId, projectId) => {
    return await (0, exports.hasProjectAccess)(userId, projectId);
};
exports.canDeleteTasks = canDeleteTasks;
//# sourceMappingURL=permissions.js.map