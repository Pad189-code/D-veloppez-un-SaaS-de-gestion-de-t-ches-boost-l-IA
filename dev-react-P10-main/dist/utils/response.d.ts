import { Response } from "express";
export declare const sendSuccess: <T>(res: Response, message: string, data?: T, statusCode?: number) => void;
export declare const sendError: (res: Response, message: string, error?: string, statusCode?: number) => void;
export declare const sendValidationError: (res: Response, message: string, errors: any[]) => void;
export declare const sendServerError: (res: Response, message?: string, error?: string) => void;
export declare const sendAuthError: (res: Response, message?: string) => void;
//# sourceMappingURL=response.d.ts.map