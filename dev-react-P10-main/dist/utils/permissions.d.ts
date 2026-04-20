import { ProjectRole } from "../types";
export declare const getUserProjectRole: (userId: string, projectId: string) => Promise<ProjectRole | null>;
export declare const hasProjectAccess: (userId: string, projectId: string) => Promise<boolean>;
export declare const isProjectAdmin: (userId: string, projectId: string) => Promise<boolean>;
export declare const isProjectOwner: (userId: string, projectId: string) => Promise<boolean>;
export declare const canModifyProject: (userId: string, projectId: string) => Promise<boolean>;
export declare const canManageContributors: (userId: string, projectId: string) => Promise<boolean>;
export declare const canDeleteProject: (userId: string, projectId: string) => Promise<boolean>;
export declare const canCreateTasks: (userId: string, projectId: string) => Promise<boolean>;
export declare const canEditTasks: (userId: string, projectId: string) => Promise<boolean>;
export declare const canDeleteTasks: (userId: string, projectId: string) => Promise<boolean>;
//# sourceMappingURL=permissions.d.ts.map