import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  getAssignedTasks,
  getProjectsWithTasks,
  getDashboardStats,
} from "../controllers/dashboardController";

const router = express.Router();

// Toutes les routes du tableau de bord nécessitent une authentification
router.use(authenticateToken);

// Récupérer les tâches assignées à l'utilisateur connecté
router.get("/assigned-tasks", getAssignedTasks);

// Récupérer les projets avec tâches assignées
router.get("/projects-with-tasks", getProjectsWithTasks);

// Récupérer les statistiques du tableau de bord
router.get("/stats", getDashboardStats);

export default router;
