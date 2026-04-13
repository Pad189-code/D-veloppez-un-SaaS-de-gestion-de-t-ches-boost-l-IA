import { Router } from "express";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addContributor,
  removeContributor,
} from "../controllers/projectController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * @route   POST /projects
 * @desc    Créer un nouveau projet
 * @access  Private (nécessite un token JWT valide)
 * @header  Authorization: Bearer <token>
 * @body    { name: string, description?: string, contributors?: string[] }
 */
router.post("/", authenticateToken, createProject);

/**
 * @route   GET /projects
 * @desc    Récupérer tous les projets de l'utilisateur connecté
 * @access  Private (nécessite un token JWT valide)
 * @header  Authorization: Bearer <token>
 */
router.get("/", authenticateToken, getProjects);

/**
 * @route   GET /projects/:id
 * @desc    Récupérer un projet spécifique
 * @access  Private (nécessite un token JWT valide et accès au projet)
 * @header  Authorization: Bearer <token>
 */
router.get("/:id", authenticateToken, getProject);

/**
 * @route   PUT /projects/:id
 * @desc    Mettre à jour un projet
 * @access  Private (nécessite un token JWT valide et droits d'admin)
 * @header  Authorization: Bearer <token>
 * @body    { name?: string, description?: string }
 */
router.put("/:id", authenticateToken, updateProject);

/**
 * @route   DELETE /projects/:id
 * @desc    Supprimer un projet
 * @access  Private (nécessite un token JWT valide et être propriétaire)
 * @header  Authorization: Bearer <token>
 */
router.delete("/:id", authenticateToken, deleteProject);

/**
 * @route   POST /projects/:id/contributors
 * @desc    Ajouter un contributeur à un projet
 * @access  Private (nécessite un token JWT valide et droits d'admin)
 * @header  Authorization: Bearer <token>
 * @body    { email: string, role?: 'ADMIN' | 'CONTRIBUTOR' }
 */
router.post("/:id/contributors", authenticateToken, addContributor);

/**
 * @route   DELETE /projects/:id/contributors/:userId
 * @desc    Retirer un contributeur d'un projet
 * @access  Private (nécessite un token JWT valide et droits d'admin)
 * @header  Authorization: Bearer <token>
 */
router.delete(
  "/:id/contributors/:userId",
  authenticateToken,
  removeContributor,
);

// Routes pour les tâches
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController";

router.post("/:id/tasks", authenticateToken, createTask);

/**
 * @route   GET /projects/:id/tasks
 * @desc    Récupérer toutes les tâches d'un projet
 * @access  Private (nécessite un token JWT valide et accès au projet)
 * @header  Authorization: Bearer <token>
 */
router.get("/:id/tasks", authenticateToken, getTasks);
router.get("/:id/tasks/:taskId", authenticateToken, getTask);
router.put("/:id/tasks/:taskId", authenticateToken, updateTask);
router.delete("/:id/tasks/:taskId", authenticateToken, deleteTask);

// Routes pour les commentaires
import {
  createComment,
  getComments,
  getComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController";

router.post("/:id/tasks/:taskId/comments", authenticateToken, createComment);
router.get("/:id/tasks/:taskId/comments", authenticateToken, getComments);
router.get(
  "/:id/tasks/:taskId/comments/:commentId",
  authenticateToken,
  getComment,
);
router.put(
  "/:id/tasks/:taskId/comments/:commentId",
  authenticateToken,
  updateComment,
);
router.delete(
  "/:id/tasks/:taskId/comments/:commentId",
  authenticateToken,
  deleteComment,
);

export default router;
