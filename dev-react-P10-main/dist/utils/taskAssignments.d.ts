export declare const validateProjectMembers: (projectId: string, userIds: string[]) => Promise<boolean>;
export declare const updateTaskAssignments: (taskId: string, assigneeIds: string[]) => Promise<void>;
export declare const getTaskAssignments: (taskId: string) => Promise<{
    id: string;
    assignedAt: Date | null;
    user: {
        email: string;
        name: string | null;
        id: string;
    };
}[]>;
//# sourceMappingURL=taskAssignments.d.ts.map