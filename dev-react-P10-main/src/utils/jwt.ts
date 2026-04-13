import jwt, { SignOptions } from "jsonwebtoken";
import { JwtPayload } from "../types";

/**
 * Génère un token JWT pour un utilisateur
 * @param userId - L'ID de l'utilisateur
 * @param email - L'email de l'utilisateur
 * @returns Le token JWT généré
 */
export const generateToken = (userId: string, email: string): string => {
  const payload: JwtPayload = {
    userId,
    email,
  };

  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  // @ts-ignore - Ignorer l'erreur TypeScript pour jwt.sign
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Vérifie et décode un token JWT
 * @param token - Le token JWT à vérifier
 * @returns Le payload décodé du token
 */
export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expiré");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Token invalide");
    } else {
      throw new Error("Erreur de vérification du token");
    }
  }
};

/**
 * Extrait le token du header Authorization
 * @param authHeader - Le header Authorization
 * @returns Le token extrait ou null
 */
export const extractTokenFromHeader = (
  authHeader: string | undefined,
): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};
