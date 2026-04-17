"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskComments = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getTaskComments = async (taskId) => {
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
        },
        orderBy: { createdAt: "asc" },
    });
    return comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
    }));
};
exports.getTaskComments = getTaskComments;
//# sourceMappingURL=taskComments.js.map