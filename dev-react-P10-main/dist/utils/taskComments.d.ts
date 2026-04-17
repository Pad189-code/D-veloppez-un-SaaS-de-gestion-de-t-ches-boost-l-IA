export declare const getTaskComments: (taskId: string) => Promise<{
    id: string;
    content: string;
    createdAt: Date;
    author: {
        email: string;
        name: string | null;
        id: string;
    };
}[]>;
//# sourceMappingURL=taskComments.d.ts.map