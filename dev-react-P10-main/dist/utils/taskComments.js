"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskComments = void 0;
const prismaSingleton_1 = require("../lib/prismaSingleton");
const getTaskComments = async (taskId) => {
    const comments = await prismaSingleton_1.prisma.comment.findMany({
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