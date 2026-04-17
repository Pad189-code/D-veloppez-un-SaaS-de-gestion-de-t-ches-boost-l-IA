import { Request } from "express";
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name?: string;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface UpdateProfileRequest {
    name?: string;
    email?: string;
}
export interface UpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface CreateProjectRequest {
    name: string;
    description?: string;
    contributors?: string[];
}
export interface UpdateProjectRequest {
    name?: string;
    description?: string;
}
export interface AddContributorRequest {
    email: string;
    role?: "ADMIN" | "CONTRIBUTOR";
}
export interface RemoveContributorRequest {
    userId: string;
}
export interface CreateTaskRequest {
    title: string;
    description?: string;
    dueDate?: string;
    assigneeIds?: string[];
}
export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
    dueDate?: string;
    assigneeIds?: string[];
}
export interface CreateCommentRequest {
    content: string;
}
export interface UpdateCommentRequest {
    content: string;
}
export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}
export interface ValidationError {
    field: string;
    message: string;
}
export declare enum Role {
    ADMIN = "ADMIN",
    CONTRIBUTOR = "CONTRIBUTOR"
}
export declare enum ProjectRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    CONTRIBUTOR = "CONTRIBUTOR"
}
export declare enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
    CANCELLED = "CANCELLED"
}
//# sourceMappingURL=index.d.ts.map