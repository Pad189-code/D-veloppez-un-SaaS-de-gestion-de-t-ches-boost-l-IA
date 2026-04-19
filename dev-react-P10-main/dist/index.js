"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const prismaSingleton_1 = require("./lib/prismaSingleton");
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const projectController_1 = require("./controllers/projectController");
const auth_1 = require("./middleware/auth");
const swagger_1 = require("./config/swagger");
dotenv_1.default.config({
    path: path_1.default.join(process.cwd(), ".env"),
    override: true,
});
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "production"
        ? ["https://votre-domaine.com"]
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:8000",
            "http://localhost:8001",
        ],
    credentials: true,
}));
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Gestionnaire de Projets - Documentation",
    customfavIcon: "/favicon.ico",
}));
app.use("/auth", authRoutes_1.default);
app.use("/projects", projectRoutes_1.default);
app.use("/dashboard", dashboardRoutes_1.default);
app.get("/users/search", auth_1.authenticateToken, projectController_1.searchUsers);
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API en ligne",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API REST avec authentification et gestion de projets",
        version: "1.0.0",
        endpoints: {
            auth: "/auth",
            projects: "/projects",
            dashboard: "/dashboard",
            usersSearch: "/users/search",
            health: "/health",
            documentation: "/api-docs",
        },
    });
});
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route non trouvée",
        error: "NOT_FOUND",
    });
});
app.use((error, req, res, next) => {
    console.error("Erreur serveur:", error);
    res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
    });
});
const startServer = async () => {
    try {
        await prismaSingleton_1.prisma.$connect();
        console.log("✅ Connexion à la base de données établie (Prisma)");
        const server = app.listen(PORT, () => {
            console.log(`🚀 Serveur démarré sur le port ${PORT}`);
            console.log(`📊 Environnement: ${process.env.NODE_ENV || "development"}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log(`📖 Documentation: http://localhost:${PORT}/api-docs`);
        });
        server.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                console.error(`❌ Le port ${PORT} est déjà utilisé (une autre instance de l’API ou un autre service).`);
                console.error(`   Libérer le port : netstat -ano | findstr :${PORT}  puis  taskkill /PID <pid> /F`);
            }
            else {
                console.error("❌ Erreur du serveur HTTP:", err);
            }
            process.exit(1);
        });
    }
    catch (error) {
        console.error("❌ Erreur lors du démarrage du serveur:", error);
        process.exit(1);
    }
};
const gracefulShutdown = async () => {
    console.log("\n🛑 Arrêt du serveur...");
    await prismaSingleton_1.prisma.$disconnect();
    process.exit(0);
};
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
startServer();
//# sourceMappingURL=index.js.map