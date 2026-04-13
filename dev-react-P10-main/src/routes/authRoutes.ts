import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 * @body    { email: string, password: string, name?: string }
 */
router.post("/register", register);

/**
 * @route   POST /auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 * @body    { email: string, password: string }
 */
router.post("/login", login);

/**
 * @route   GET /auth/profile
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Private (nécessite un token JWT valide)
 * @header  Authorization: Bearer <token>
 */
router.get("/profile", authenticateToken, getProfile);

/**
 * @route   PUT /auth/profile
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @access  Private (nécessite un token JWT valide)
 * @header  Authorization: Bearer <token>
 * @body    { name?: string, email?: string }
 */
router.put("/profile", authenticateToken, updateProfile);

/**
 * @route   PUT /auth/password
 * @desc    Mettre à jour le mot de passe de l'utilisateur connecté
 * @access  Private (nécessite un token JWT valide)
 * @header  Authorization: Bearer <token>
 * @body    { currentPassword: string, newPassword: string }
 */
router.put("/password", authenticateToken, updatePassword);

export default router;
