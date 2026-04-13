import { Response } from "express";
import { ApiResponse } from "../types";

/**
 * Envoie une réponse de succès
 * @param res - L'objet Response d'Express
 * @param message - Le message de succès
 * @param data - Les données à envoyer
 * @param statusCode - Le code de statut HTTP (défaut: 200)
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(response);
};

/**
 * Envoie une réponse d'erreur
 * @param res - L'objet Response d'Express
 * @param message - Le message d'erreur
 * @param error - Le détail de l'erreur
 * @param statusCode - Le code de statut HTTP (défaut: 400)
 */
export const sendError = (
  res: Response,
  message: string,
  error?: string,
  statusCode: number = 400,
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };

  res.status(statusCode).json(response);
};

/**
 * Envoie une réponse de validation d'erreur
 * @param res - L'objet Response d'Express
 * @param message - Le message d'erreur
 * @param errors - Les erreurs de validation
 */
export const sendValidationError = (
  res: Response,
  message: string,
  errors: any[],
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    error: "Validation failed",
    data: { errors },
  };

  res.status(400).json(response);
};

/**
 * Envoie une réponse d'erreur serveur interne
 * @param res - L'objet Response d'Express
 * @param message - Le message d'erreur
 * @param error - Le détail de l'erreur
 */
export const sendServerError = (
  res: Response,
  message: string = "Erreur interne du serveur",
  error?: string,
): void => {
  sendError(res, message, error, 500);
};

/**
 * Envoie une réponse d'erreur d'authentification
 * @param res - L'objet Response d'Express
 * @param message - Le message d'erreur
 */
export const sendAuthError = (
  res: Response,
  message: string = "Non autorisé",
): void => {
  sendError(res, message, "Authentication failed", 401);
};
