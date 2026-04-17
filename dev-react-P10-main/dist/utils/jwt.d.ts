import { JwtPayload } from "../types";
export declare const generateToken: (userId: string, email: string) => string;
export declare const verifyToken: (token: string) => JwtPayload;
export declare const extractTokenFromHeader: (authHeader: string | undefined) => string | null;
//# sourceMappingURL=jwt.d.ts.map