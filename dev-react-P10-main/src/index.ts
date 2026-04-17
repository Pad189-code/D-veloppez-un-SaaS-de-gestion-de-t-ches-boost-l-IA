import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import taskRoutes from "./routes/taskRoutes"; // Importé
import commentRoutes from "./routes/commentRoutes"; // Importé
import { searchUsers } from "./controllers/projectController";

// Middleware
import { authenticateToken } from "./middleware/auth";

// Swagger
import { specs } from "./config/swagger";

// Charger .env depuis la racine du projet (évite "injecting env (0)" si cwd/dotenv ne ciblent pas le bon fichier)
dotenv.config({
  path: path.join(process.cwd(), ".env"),
  override: true,
});

// Initialiser Prisma
const prisma = new PrismaClient();

// Créer l'application Express
const app = express();

// --- CONFIGURATION PORT : .env (ex. 8000) pour laisser 3000 au frontend Next ---
const PORT = process.env.PORT || 8000;

// Middleware de sécurité
app.use(helmet());

// Middleware CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://votre-domaine.com"]
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:8000",
            "http://localhost:8001",
          ],
    credentials: true,
  }),
);

// Middleware de logging
app.use(morgan("combined"));

// Middleware pour parser le JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Documentation Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Gestionnaire de Projets - Documentation",
    customfavIcon: "/favicon.ico",
  }),
);

// --- ENREGISTREMENT DES ROUTES ---
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/tasks", taskRoutes); // Ajouté
app.use("/comments", commentRoutes); // Ajouté

// Route pour la recherche d'utilisateurs
app.get("/users/search", authenticateToken, searchUsers);

// Route de santé
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API en ligne",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Route racine (mise à jour pour inclure les nouveaux endpoints)
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API REST avec authentification et gestion de projets",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      projects: "/projects",
      dashboard: "/dashboard",
      tasks: "/tasks",
      comments: "/comments",
      health: "/health",
      documentation: "/api-docs",
    },
  });
});

// Middleware 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée",
    error: "NOT_FOUND",
  });
});

// Gestion d'erreurs globale
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Erreur serveur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  },
);

// Fonction de démarrage
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Connexion à la base de données établie (Prisma)");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📊 Environnement: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📖 Documentation: http://localhost:${PORT}/api-docs`);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `❌ Le port ${PORT} est déjà utilisé (une autre instance de l’API ou un autre service).`,
        );
        console.error(
          `   Libérer le port : netstat -ano | findstr :${PORT}  puis  taskkill /PID <pid> /F`,
        );
      } else {
        console.error("❌ Erreur du serveur HTTP:", err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

// Shutdown propre
const gracefulShutdown = async () => {
  console.log("\n🛑 Arrêt du serveur...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

startServer();
