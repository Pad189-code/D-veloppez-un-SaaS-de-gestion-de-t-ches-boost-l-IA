"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskAssignments = exports.updateTaskAssignments = exports.validateProjectMembers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const validateProjectMembers = async (projectId, userIds) => {
    if (userIds.length === 0)
        return true;
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
    if (!project)
        return false;
    const allowed = new Set([project.ownerId]);
    for (const c of project.collaborators) {
        allowed.add(c.userId);
    }
    return userIds.every((id) => allowed.has(id));
};
exports.validateProjectMembers = validateProjectMembers;
const updateTaskAssignments = async (taskId, assigneeIds) => {
    await prisma.task.update({
        where: { id: taskId },
        data: {
            assignees: {
                set: assigneeIds.map((userId) => ({ id: userId })),
            },
        },
    });
};
exports.updateTaskAssignments = updateTaskAssignments;
const getTaskAssignments = async (taskId) => {
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
        assignedAt: null,
        user,
    }));
};
exports.getTaskAssignments = getTaskAssignments;
//# sourceMappingURL=taskAssignments.js.map