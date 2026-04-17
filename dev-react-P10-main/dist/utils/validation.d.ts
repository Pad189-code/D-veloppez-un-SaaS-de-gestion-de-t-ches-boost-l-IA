import { ValidationError } from "../types";
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPassword: (password: string) => boolean;
export declare const isValidDate: (dateString: string) => boolean;
export declare const validateRegisterData: (data: {
    email: string;
    password: string;
    name?: string;
}) => ValidationError[];
export declare const validateLoginData: (data: {
    email: string;
    password: string;
}) => ValidationError[];
export declare const validateUpdateProfileData: (data: {
    name?: string;
    email?: string;
}) => ValidationError[];
export declare const validateUpdatePasswordData: (data: {
    currentPassword: string;
    newPassword: string;
}) => ValidationError[];
export declare const validateCreateProjectData: (data: {
    name: string;
    description?: string;
    contributors?: string[];
}) => ValidationError[];
export declare const validateUpdateProjectData: (data: {
    name?: string;
    description?: string;
}) => ValidationError[];
export declare const validateCreateTaskData: (data: {
    title: string;
    description?: string;
    dueDate?: string;
    assigneeIds?: string[];
}) => ValidationError[];
export declare const validateUpdateTaskData: (data: {
    title?: string;
    description?: string;
    status?: string;
    dueDate?: string;
    assigneeIds?: string[];
}) => ValidationError[];
export declare const validateCreateCommentData: (data: {
    content: string;
}) => ValidationError[];
export declare const validateUpdateCommentData: (data: {
    content?: string;
}) => ValidationError[];
//# sourceMappingURL=validation.d.ts.map