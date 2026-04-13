import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Gestionnaire de Projets",
      version: "1.0.0",
      description:
        "API REST pour la gestion de projets, tâches et commentaires avec authentification JWT",
      contact: {
        name: "Support API",
        email: "support@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Serveur de développement",
      },
      {
        url: "https://api.example.com",
        description: "Serveur de production",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenu lors de la connexion",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID unique de l'utilisateur",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email de l'utilisateur",
            },
            name: {
              type: "string",
              description: "Nom de l'utilisateur",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Date de création du compte",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Date de dernière modification",
            },
          },
          required: ["id", "email"],
        },
        Project: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID unique du projet",
            },
            name: {
              type: "string",
              description: "Nom du projet",
            },
            description: {
              type: "string",
              description: "Description du projet",
            },
            ownerId: {
              type: "string",
              description: "ID du propriétaire du projet",
            },
            owner: {
              $ref: "#/components/schemas/User",
            },
            collaborators: {
              type: "array",
              items: {
                $ref: "#/components/schemas/ProjectCollaborator",
              },
            },
            userRole: {
              type: "string",
              enum: ["OWNER", "ADMIN", "CONTRIBUTOR"],
              description:
                "Rôle de l'utilisateur connecté sur ce projet (hors réponse liste brute)",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
          required: ["id", "name", "ownerId"],
        },
        ProjectCollaborator: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            role: {
              type: "string",
              enum: ["ADMIN", "CONTRIBUTOR"],
              description: "Rôle du collaborateur invité",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID unique de la tâche",
            },
            title: {
              type: "string",
              description: "Titre de la tâche",
            },
            description: {
              type: "string",
              description: "Description de la tâche",
            },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"],
              description: "Statut de la tâche",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              description: "Date d'échéance de la tâche",
            },
            projectId: {
              type: "string",
              description: "ID du projet associé",
            },
            assignees: {
              type: "array",
              items: {
                $ref: "#/components/schemas/TaskAssignee",
              },
            },
            comments: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Comment",
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
          required: ["id", "title", "status", "projectId"],
        },
        TaskAssignee: {
          type: "object",
          description: "Entrée d'assignation (compatibilité API)",
          properties: {
            id: {
              type: "string",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
            assignedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        Comment: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID unique du commentaire",
            },
            content: {
              type: "string",
              description: "Contenu du commentaire",
            },
            taskId: {
              type: "string",
              description: "ID de la tâche associée",
            },
            authorId: {
              type: "string",
              description: "ID de l'auteur du commentaire",
            },
            author: {
              $ref: "#/components/schemas/User",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
          required: ["id", "content", "taskId", "authorId"],
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Message d'erreur",
            },
            error: {
              type: "string",
              description: "Code d'erreur",
            },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                  },
                  message: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              description: "Message de succès",
            },
            data: {
              type: "object",
              description: "Données de la réponse",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/index.ts"],
};

export const specs = swaggerJsdoc(options);
