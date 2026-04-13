import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  UpdatePasswordRequest,
  AuthRequest,
} from "../types";
import {
  validateRegisterData,
  validateLoginData,
  validateUpdateProfileData,
  validateUpdatePasswordData,
} from "../utils/validation";
import { generateToken } from "../utils/jwt";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendServerError,
} from "../utils/response";

const prisma = new PrismaClient();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Mot de passe (minimum 6 caractères)
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 description: Nom de l'utilisateur
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: Token JWT d'authentification
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name }: RegisterRequest = req.body;

    // Validation des données
    const validationErrors = validateRegisterData({ email, password, name });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données d'inscription invalides",
        validationErrors,
      );
      return;
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      sendError(
        res,
        "Un utilisateur avec cet email existe déjà",
        "EMAIL_ALREADY_EXISTS",
        409,
      );
      return;
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer le nouvel utilisateur
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

    // Générer le token JWT
    const token = generateToken(newUser.id, newUser.email);

    // Envoyer la réponse
    sendSuccess(
      res,
      "Utilisateur créé avec succès",
      {
        user: newUser,
        token,
      },
      201,
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    sendServerError(res, "Erreur lors de l'inscription");
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: Mot de passe
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: Token JWT d'authentification
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation des données
    const validationErrors = validateLoginData({ email, password });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données de connexion invalides",
        validationErrors,
      );
      return;
    }

    // Rechercher l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      sendError(
        res,
        "Email ou mot de passe incorrect",
        "INVALID_CREDENTIALS",
        401,
      );
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      sendError(
        res,
        "Email ou mot de passe incorrect",
        "INVALID_CREDENTIALS",
        401,
      );
      return;
    }

    // Générer le token JWT
    const token = generateToken(user.id, user.email);

    // Préparer les données utilisateur pour la réponse
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };

    // Envoyer la réponse
    sendSuccess(res, "Connexion réussie", {
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    sendServerError(res, "Erreur lors de la connexion");
  }
};

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // L'utilisateur est déjà disponible grâce au middleware d'authentification
    const user = (req as any).user;

    if (!user) {
      sendError(res, "Utilisateur non trouvé", "USER_NOT_FOUND", 404);
      return;
    }

    sendSuccess(res, "Profil récupéré avec succès", { user });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    sendServerError(res, "Erreur lors de la récupération du profil");
  }
};

/**
 * Mettre à jour le profil de l'utilisateur connecté
 * PUT /auth/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email }: UpdateProfileRequest = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Validation des données
    const validationErrors = validateUpdateProfileData({ name, email });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données de mise à jour invalides",
        validationErrors,
      );
      return;
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email.toLowerCase() !== authReq.user.email.toLowerCase()) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        sendError(
          res,
          "Un utilisateur avec cet email existe déjà",
          "EMAIL_ALREADY_EXISTS",
          409,
        );
        return;
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim() || null;
    }
    if (email !== undefined) {
      updateData.email = email.toLowerCase();
    }

    // Mettre à jour l'utilisateur
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

    sendSuccess(res, "Profil mis à jour avec succès", { user: updatedUser });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    sendServerError(res, "Erreur lors de la mise à jour du profil");
  }
};

/**
 * Mettre à jour le mot de passe de l'utilisateur connecté
 * PUT /auth/password
 */
export const updatePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { currentPassword, newPassword }: UpdatePasswordRequest = req.body;
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, "Utilisateur non authentifié", "UNAUTHORIZED", 401);
      return;
    }

    // Validation des données
    const validationErrors = validateUpdatePasswordData({
      currentPassword,
      newPassword,
    });
    if (validationErrors.length > 0) {
      sendValidationError(
        res,
        "Données de mise à jour du mot de passe invalides",
        validationErrors,
      );
      return;
    }

    // Récupérer l'utilisateur avec son mot de passe actuel
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
    });

    if (!user) {
      sendError(res, "Utilisateur non trouvé", "USER_NOT_FOUND", 404);
      return;
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      sendError(
        res,
        "Mot de passe actuel incorrect",
        "INVALID_CURRENT_PASSWORD",
        401,
      );
      return;
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: authReq.user.id },
      data: { password: hashedNewPassword },
    });

    sendSuccess(res, "Mot de passe mis à jour avec succès");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe:", error);
    sendServerError(res, "Erreur lors de la mise à jour du mot de passe");
  }
};
