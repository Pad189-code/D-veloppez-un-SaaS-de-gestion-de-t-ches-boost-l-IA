import { Router } from "express";
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
import { authenticateToken } from "../middleware/auth";
import commentRoutes from "./commentRoutes";

const router = Router();

/**
 * @route   POST /projects/:projectId/tasks
 * @desc    Créer une nouvelle tâche dans un projet
 * @access  Private (nécessite un token JWT valide et accès au projet)
 * @header  Authorization: Bearer <token>
 * @body    { title: string, description?: string, dueDate?: string, assigneeIds?: string[] }
 */
router.post("/", authenticateToken, createTask);

/**
 * @route   GET /projects/:projectId/tasks
 * @desc    Récupérer toutes les tâches d'un projet
 * @access  Private (nécessite un token JWT valide et accès au projet)
 * @header  Authorization: Bearer <token>
 */
router.get("/", authenticateToken, getTasks);

/**
 * @route   GET /projects/:projectId/tasks/:taskId
 * @desc    Récupérer une tâche spécifique
 * @access  Private (nécessite un token JWT valide et accès au projet)
 * @header  Authorization: Bearer <token>
 */
router.get("/:taskId", authenticateToken, getTask);

/**
 * @route   PUT /projects/:projectId/tasks/:taskId
 * @desc    Mettre à jour une tâche
 * @access  Private (nécessite un token JWT valide et accès au projet)
 * @header  Authorization: Bearer <token>
 * @body    { title?: string, description?: string, status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED', dueDate?: string, assigneeIds?: string[] }
 */
router.put("/:taskId", authenticateToken, updateTask);

/**
 * @route   DELETE /projects/:projectId/tasks/:taskId
 * @desc    Supprimer une tâche
 * @access  Private (nécessite un token JWT valide et accès au projet)
 * @header  Authorization: Bearer <token>
 */
router.delete("/:taskId", authenticateToken, deleteTask);

// Routes pour les commentaires
router.use("/:taskId/comments", commentRoutes);

export default router;
