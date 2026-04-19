"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskAssignments = exports.updateTaskAssignments = exports.validateProjectMembers = void 0;
const prismaSingleton_1 = require("../lib/prismaSingleton");
const validateProjectMembers = async (projectId, userIds) => {
    if (userIds.length === 0)
        return true;
    const project = await prismaSingleton_1.prisma.project.findUnique({
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
    await prismaSingleton_1.prisma.task.update({
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
    const task = await prismaSingleton_1.prisma.task.findUnique({
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