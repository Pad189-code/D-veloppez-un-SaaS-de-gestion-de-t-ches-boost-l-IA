import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../types";
import { verifyToken, extractTokenFromHeader } from "../utils/jwt";
import { sendAuthError } from "../utils/response";

const prisma = new PrismaClient();

/**
 * Middleware d'authentification pour vérifier les tokens JWT
 * Ajoute les informations de l'utilisateur à req.user si l'authentification réussit
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      sendAuthError(res, "Token d'authentification manquant");
      return;
    }

    // Vérifier et décoder le token
    const decoded = verifyToken(token);

    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      sendAuthError(res, "Utilisateur non trouvé");
      return;
    }

    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
    };
    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error);

    if (error instanceof Error) {
      sendAuthError(res, error.message);
    } else {
      sendAuthError(res, "Erreur d'authentification");
    }
  }
};

/**
 * Middleware optionnel d'authentification
 * Ne bloque pas la requête si l'utilisateur n'est pas authentifié
 * Ajoute req.user si l'authentification réussit
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);
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
  } catch (error) {
    // En cas d'erreur, on continue sans authentification
    console.warn("Erreur d'authentification optionnelle:", error);
    next();
  }
};
