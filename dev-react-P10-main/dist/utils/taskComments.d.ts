export declare const getTaskComments: (taskId: string) => Promise<{
    id: string;
    content: string;
    createdAt: Date;
    author: {
        name: string | null;
        id: string;
        email: string;
    };
}[]>;
//# sourceMappingURL=taskComments.d.ts.map