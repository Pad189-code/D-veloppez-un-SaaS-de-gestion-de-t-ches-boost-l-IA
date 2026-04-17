"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const validation_1 = require("../utils/validation");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const prisma = new client_1.PrismaClient();
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const validationErrors = (0, validation_1.validateRegisterData)({ email, password, name });
        if (validationErrors.length > 0) {
            (0, response_1.sendValidationError)(res, "Données d'inscription invalides", validationErrors);
            return;
        }
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            (0, response_1.sendError)(res, "Un utilisateur avec cet email existe déjà", "EMAIL_ALREADY_EXISTS", 409);
            return;
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const newUser = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name?.trim() || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });
        const token = (0, jwt_1.generateToken)(newUser.id, newUser.email);
        (0, response_1.sendSuccess)(res, "Utilisateur créé avec succès", {
            user: newUser,
            token,
        }, 201);
    }
    catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de l'inscription");
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const validationErrors = (0, validation_1.validateLoginData)({ email, password });
        if (validationErrors.length > 0) {
            (0, response_1.sendValidationError)(res, "Données de connexion invalides", validationErrors);
            return;
        }
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            (0, response_1.sendError)(res, "Email ou mot de passe incorrect", "INVALID_CREDENTIALS", 401);
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        console.log("password", password);
        console.log("user.password", user.password);
        if (!isPasswordValid) {
            (0, response_1.sendError)(res, "Email ou mot de passe incorrect", "INVALID_CREDENTIALS", 401);
            return;
        }
        const token = (0, jwt_1.generateToken)(user.id, user.email);
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
        };
        (0, response_1.sendSuccess)(res, "Connexion réussie", {
            user: userData,
            token,
        });
    }
    catch (error) {
        console.error("Erreur lors de la connexion:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la connexion");
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            (0, response_1.sendError)(res, "Utilisateur non trouvé", "USER_NOT_FOUND", 404);
            return;
        }
        (0, response_1.sendSuccess)(res, "Profil récupéré avec succès", { user });
    }
    catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la récupération du profil");
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const validationErrors = (0, validation_1.validateUpdateProfileData)({ name, email });
        if (validationErrors.length > 0) {
            (0, response_1.sendValidationError)(res, "Données de mise à jour invalides", validationErrors);
            return;
        }
        if (email && email.toLowerCase() !== authReq.user.email.toLowerCase()) {
            const existingUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (existingUser) {
                (0, response_1.sendError)(res, "Un utilisateur avec cet email existe déjà", "EMAIL_ALREADY_EXISTS", 409);
                return;
            }
        }
        const updateData = {};
        if (name !== undefined) {
            updateData.name = name.trim() || null;
        }
        if (email !== undefined) {
            updateData.email = email.toLowerCase();
        }
        const updatedUser = await prisma.user.update({
            where: { id: authReq.user.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });
        (0, response_1.sendSuccess)(res, "Profil mis à jour avec succès", { user: updatedUser });
    }
    catch (error) {
        console.error("Erreur lors de la mise à jour du profil:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la mise à jour du profil");
    }
};
exports.updateProfile = updateProfile;
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
            return;
        }
        const validationErrors = (0, validation_1.validateUpdatePasswordData)({
            currentPassword,
            newPassword,
        });
        if (validationErrors.length > 0) {
            (0, response_1.sendValidationError)(res, "Données de mise à jour du mot de passe invalides", validationErrors);
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: authReq.user.id },
        });
        if (!user) {
            (0, response_1.sendError)(res, "Utilisateur non trouvé", "USER_NOT_FOUND", 404);
            return;
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            (0, response_1.sendError)(res, "Mot de passe actuel incorrect", "INVALID_CURRENT_PASSWORD", 401);
            return;
        }
        const saltRounds = 12;
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        await prisma.user.update({
            where: { id: authReq.user.id },
            data: { password: hashedNewPassword },
        });
        (0, response_1.sendSuccess)(res, "Mot de passe mis à jour avec succès");
    }
    catch (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        (0, response_1.sendServerError)(res, "Erreur lors de la mise à jour du mot de passe");
    }
};
exports.updatePassword = updatePassword;
//# sourceMappingURL=authController.js.map