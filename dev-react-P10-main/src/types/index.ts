import { Request } from "express";

// Types pour l'authentification
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Types pour les réponses d'API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Types pour l'inscription
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

// Types pour la connexion
export interface LoginRequest {
  email: string;
  password: string;
}

// Types pour la mise à jour du profil
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Types pour les projets
export interface CreateProjectRequest {
  name: string;
  description?: string;
  contributors?: string[]; // Array d'emails des contributeurs
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface AddContributorRequest {
  email: string;
  role?: "ADMIN" | "CONTRIBUTOR";
}

export interface RemoveContributorRequest {
  userId: string;
}

// Types pour les tâches
export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string; // ISO date string
  assigneeIds?: string[]; // IDs des utilisateurs assignés à la tâche
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  dueDate?: string; // ISO date string
  assigneeIds?: string[]; // IDs des utilisateurs assignés à la tâche
}

// Types pour les commentaires
export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// Types pour les tokens JWT
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Types pour les erreurs
export interface ValidationError {
  field: string;
  message: string;
}

// Rôle d'un collaborateur invité (le propriétaire n'est pas dans cette table)
export enum Role {
  ADMIN = "ADMIN",
  CONTRIBUTOR = "CONTRIBUTOR",
}

/** Rôle effectif d'un utilisateur sur un projet (API `userRole`) */
export enum ProjectRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  CONTRIBUTOR = "CONTRIBUTOR",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: "À faire" | "En cours" | "Terminé";
  project: string;
  date: string;
  comments: number;
}
