"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const prisma = new client_1.PrismaClient();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            (0, response_1.sendAuthError)(res, "Token d'authentification manquant");
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        if (!user) {
            (0, response_1.sendAuthError)(res, "Utilisateur non trouvé");
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
        };
        next();
    }
    catch (error) {
        console.error("Erreur d'authentification:", error);
        if (error instanceof Error) {
            (0, response_1.sendAuthError)(res, error.message);
        }
        else {
            (0, response_1.sendAuthError)(res, "Erreur d'authentification");
        }
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            next();
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        if (user) {
            req.user = {
                id: user.id,
                email: user.email,
                name: user.name || undefined,
            };
        }
        next();
    }
    catch (error) {
        console.warn("Erreur d'authentification optionnelle:", error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map