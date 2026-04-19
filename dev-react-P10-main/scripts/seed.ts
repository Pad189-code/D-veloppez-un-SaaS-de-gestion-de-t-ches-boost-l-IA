import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prismaSingleton";

interface SeedUser {
  email: string;
  name: string;
  password: string;
}

interface SeedProject {
  name: string;
  description: string;
  ownerId: string;
  contributors: string[];
}

interface SeedTask {
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  dueDate: Date;
  assignees: string[];
}

interface SeedComment {
  content: string;
  authorId: string;
}

const users: SeedUser[] = [
  { email: "alice@example.com", name: "Alice Martin", password: "password123" },
  { email: "bob@example.com", name: "Bob Dupont", password: "password123" },
  {
    email: "caroline@example.com",
    name: "Caroline Leroy",
    password: "password123",
  },
  { email: "david@example.com", name: "David Moreau", password: "password123" },
  { email: "emma@example.com", name: "Emma Rousseau", password: "password123" },
  {
    email: "francois@example.com",
    name: "François Dubois",
    password: "password123",
  },
  {
    email: "gabrielle@example.com",
    name: "Gabrielle Simon",
    password: "password123",
  },
  {
    email: "henri@example.com",
    name: "Henri Laurent",
    password: "password123",
  },
  {
    email: "isabelle@example.com",
    name: "Isabelle Petit",
    password: "password123",
  },
  {
    email: "jacques@example.com",
    name: "Jacques Durand",
    password: "password123",
  },
];

const projects: SeedProject[] = [
  {
    name: "Application E-commerce",
    description:
      "Développement d'une plateforme de vente en ligne moderne avec paiement sécurisé et gestion des stocks.",
    ownerId: "",
    contributors: [
      "bob@example.com",
      "caroline@example.com",
      "david@example.com",
    ],
  },
  {
    name: "Système de Gestion RH",
    description:
      "Application web pour la gestion des ressources humaines : congés, évaluations, planning.",
    ownerId: "",
    contributors: [
      "emma@example.com",
      "francois@example.com",
      "gabrielle@example.com",
    ],
  },
  {
    name: "Application Mobile Fitness",
    description:
      "App mobile pour le suivi d'entraînement, nutrition et objectifs fitness personnalisés.",
    ownerId: "",
    contributors: ["henri@example.com", "isabelle@example.com"],
  },
  {
    name: "Plateforme de Formation",
    description:
      "Système de gestion de cours en ligne avec vidéos, quiz et suivi des progrès.",
    ownerId: "",
    contributors: ["jacques@example.com", "alice@example.com"],
  },
  {
    name: "Dashboard Analytics",
    description:
      "Interface de visualisation de données avec graphiques interactifs et rapports automatisés.",
    ownerId: "",
    contributors: ["bob@example.com", "emma@example.com", "henri@example.com"],
  },
];

const tasks: SeedTask[] = [
  {
    title: "Conception de la base de données",
    description:
      "Créer le schéma de base de données pour les produits, utilisateurs, commandes et paiements.",
    status: "DONE",
    dueDate: new Date("2024-01-15"),
    assignees: ["bob@example.com", "caroline@example.com"],
  },
  {
    title: "Développement de l'API REST",
    description:
      "Implémenter les endpoints pour la gestion des produits, panier et commandes.",
    status: "IN_PROGRESS",
    dueDate: new Date("2024-02-01"),
    assignees: ["david@example.com"],
  },
  {
    title: "Interface utilisateur responsive",
    description:
      "Créer les composants React pour la liste des produits, panier et checkout.",
    status: "DONE",
    dueDate: new Date("2024-02-15"),
    assignees: ["alice@example.com", "caroline@example.com"],
  },
  {
    title: "Intégration système de paiement",
    description: "Intégrer Stripe pour le traitement des paiements sécurisés.",
    status: "TODO",
    dueDate: new Date("2024-02-28"),
    assignees: ["bob@example.com"],
  },
  {
    title: "Tests automatisés",
    description:
      "Écrire les tests unitaires et d'intégration pour l'API et l'interface.",
    status: "TODO",
    dueDate: new Date("2024-03-10"),
    assignees: ["david@example.com", "caroline@example.com"],
  },
  {
    title: "Module de gestion des congés",
    description:
      "Développer le système de demande et validation des congés avec workflow d'approbation.",
    status: "IN_PROGRESS",
    dueDate: new Date("2024-01-20"),
    assignees: ["emma@example.com", "francois@example.com"],
  },
  {
    title: "Interface d'évaluation des employés",
    description:
      "Créer les formulaires d'évaluation et le système de notation.",
    status: "TODO",
    dueDate: new Date("2024-02-05"),
    assignees: ["gabrielle@example.com"],
  },
  {
    title: "Tableau de bord RH",
    description:
      "Dashboard avec statistiques sur les effectifs, congés et performances.",
    status: "TODO",
    dueDate: new Date("2024-02-20"),
    assignees: ["emma@example.com"],
  },
  {
    title: "Design de l'interface mobile",
    description: "Créer les maquettes et prototypes pour l'application mobile.",
    status: "DONE",
    dueDate: new Date("2024-01-10"),
    assignees: ["henri@example.com"],
  },
  {
    title: "Développement des écrans principaux",
    description:
      "Implémenter les écrans d'accueil, profil utilisateur et suivi d'entraînement.",
    status: "IN_PROGRESS",
    dueDate: new Date("2024-01-25"),
    assignees: ["isabelle@example.com", "henri@example.com"],
  },
  {
    title: "Intégration API nutrition",
    description:
      "Connecter l'app à une API de données nutritionnelles pour les calories et nutriments.",
    status: "TODO",
    dueDate: new Date("2024-02-10"),
    assignees: ["henri@example.com"],
  },
  {
    title: "Système de gestion des cours",
    description:
      "Créer l'interface d'administration pour ajouter et organiser les cours.",
    status: "DONE",
    dueDate: new Date("2024-01-05"),
    assignees: ["jacques@example.com"],
  },
  {
    title: "Lecteur vidéo personnalisé",
    description:
      "Développer un lecteur vidéo avec contrôles de progression et notes.",
    status: "IN_PROGRESS",
    dueDate: new Date("2024-01-30"),
    assignees: ["alice@example.com", "jacques@example.com"],
  },
  {
    title: "Système de quiz interactif",
    description:
      "Créer les quiz avec questions à choix multiples et évaluation automatique.",
    status: "TODO",
    dueDate: new Date("2024-02-15"),
    assignees: ["alice@example.com"],
  },
  {
    title: "Architecture des données",
    description:
      "Concevoir l'architecture pour la collecte et le stockage des données analytiques.",
    status: "DONE",
    dueDate: new Date("2024-01-08"),
    assignees: ["bob@example.com"],
  },
  {
    title: "Développement des graphiques",
    description:
      "Implémenter les composants de visualisation avec Chart.js ou D3.js.",
    status: "IN_PROGRESS",
    dueDate: new Date("2024-01-22"),
    assignees: ["emma@example.com", "henri@example.com"],
  },
  {
    title: "Système d'alertes",
    description:
      "Créer le système de notifications pour les seuils et anomalies détectées.",
    status: "TODO",
    dueDate: new Date("2024-02-08"),
    assignees: ["bob@example.com"],
  },
];

const comments: SeedComment[] = [
  {
    content:
      "Base de données créée avec succès. Toutes les tables sont en place et les relations sont correctes.",
    authorId: "",
  },
  {
    content:
      "API REST en cours de développement. Les endpoints produits et utilisateurs sont terminés.",
    authorId: "",
  },
  {
    content:
      "Interface responsive en cours. Les composants de base sont créés, reste à implémenter le panier.",
    authorId: "",
  },
  {
    content:
      "Intégration Stripe prévue pour la semaine prochaine. Documentation consultée.",
    authorId: "",
  },
  {
    content:
      "Tests unitaires écrits pour 80% des fonctions. Tests d'intégration à venir.",
    authorId: "",
  },
  {
    content: "Module congés bien avancé. Workflow d'approbation fonctionnel.",
    authorId: "",
  },
  {
    content:
      "Formulaires d'évaluation créés. Interface intuitive et responsive.",
    authorId: "",
  },
  {
    content: "Dashboard RH en cours. Statistiques de base affichées.",
    authorId: "",
  },
  {
    content:
      "Design mobile terminé et validé par le client. Interface moderne et intuitive.",
    authorId: "",
  },
  {
    content:
      "Écrans principaux en développement. Navigation fluide entre les sections.",
    authorId: "",
  },
  {
    content:
      "API nutrition identifiée. Documentation reçue, intégration prévue.",
    authorId: "",
  },
  {
    content:
      "Système de cours opérationnel. Interface d'administration complète.",
    authorId: "",
  },
  {
    content: "Lecteur vidéo en cours. Contrôles de base implémentés.",
    authorId: "",
  },
  {
    content: "Quiz interactif en développement. Système de notation en place.",
    authorId: "",
  },
  {
    content:
      "Architecture données validée. Performance optimisée pour les gros volumes.",
    authorId: "",
  },
  {
    content:
      "Graphiques en cours. Chart.js intégré, premiers graphiques affichés.",
    authorId: "",
  },
  {
    content:
      "Système d'alertes planifié. Notifications par email et push prévues.",
    authorId: "",
  },
  {
    content:
      "Excellent travail sur cette tâche ! Le code est propre et bien documenté.",
    authorId: "",
  },
  {
    content:
      "Attention à la sécurité des données. Vérifier les permissions utilisateur.",
    authorId: "",
  },
  { content: "Deadline respectée, bravo à toute l'équipe !", authorId: "" },
  {
    content: "Petit bug détecté sur mobile. À corriger avant la livraison.",
    authorId: "",
  },
  {
    content: "Documentation mise à jour. Tutoriel d'utilisation créé.",
    authorId: "",
  },
  {
    content: "Tests de charge effectués. Performance satisfaisante.",
    authorId: "",
  },
  {
    content: "Code review terminée. Quelques améliorations mineures suggérées.",
    authorId: "",
  },
  {
    content: "Déploiement en production réussi. Monitoring en place.",
    authorId: "",
  },
];

function mapTaskStatus(
  s: SeedTask["status"],
): "TODO" | "IN_PROGRESS" | "DONE" {
  if (s === "CANCELLED") return "DONE";
  return s;
}

async function seed() {
  console.log("🌱 Début du seeding de la base de données...");

  try {
    console.log("🧹 Nettoyage de la base de données...");
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectCollaborator.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    console.log("👥 Création des utilisateurs...");
    const createdUsers: { [email: string]: string } = {};

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
        },
      });
      createdUsers[userData.email] = user.id;
      console.log(`✅ Utilisateur créé: ${userData.name} (${userData.email})`);
    }

    console.log("📁 Création des projets...");
    const createdProjects: { [name: string]: string } = {};

    for (const projectData of projects) {
      const project = await prisma.project.create({
        data: {
          name: projectData.name,
          description: projectData.description,
          ownerId: createdUsers[projectData.ownerId || "alice@example.com"],
        },
      });
      createdProjects[projectData.name] = project.id;
      console.log(`✅ Projet créé: ${projectData.name}`);

      for (const contributorEmail of projectData.contributors) {
        if (createdUsers[contributorEmail]) {
          await prisma.projectCollaborator.create({
            data: {
              userId: createdUsers[contributorEmail],
              projectId: project.id,
              role: "CONTRIBUTOR",
            },
          });
          console.log(`  👤 Contributeur ajouté: ${contributorEmail}`);
        }
      }
    }

    console.log("📋 Création des tâches...");
    const projectNames = Object.keys(createdProjects);
    let taskIndex = 0;

    for (const taskData of tasks) {
      const projectName = projectNames[taskIndex % projectNames.length];
      const projectId = createdProjects[projectName];

      const assigneeIds = taskData.assignees
        .filter((email) => createdUsers[email])
        .map((email) => ({ id: createdUsers[email] }));

      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          status: mapTaskStatus(taskData.status),
          dueDate: taskData.dueDate,
          projectId,
          assignees: assigneeIds.length
            ? { connect: assigneeIds }
            : undefined,
        },
      });
      console.log(`✅ Tâche créée: ${taskData.title}`);

      const commentCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < commentCount; i++) {
        const commentIndex = (taskIndex * commentCount + i) % comments.length;
        const commentData = comments[commentIndex];

        const possibleAuthors = [...taskData.assignees];
        const project = projects.find((p) => p.name === projectName);
        if (project) {
          possibleAuthors.push("alice@example.com");
        }

        const authorEmail =
          possibleAuthors[Math.floor(Math.random() * possibleAuthors.length)];

        if (createdUsers[authorEmail]) {
          await prisma.comment.create({
            data: {
              content: commentData.content,
              authorId: createdUsers[authorEmail],
              taskId: task.id,
            },
          });
          console.log(`  💬 Commentaire ajouté par ${authorEmail}`);
        }
      }

      taskIndex++;
    }

    console.log("🎉 Seeding terminé avec succès !");
    console.log(`📊 Résumé:`);
    console.log(`  - ${users.length} utilisateurs créés`);
    console.log(`  - ${projects.length} projets créés`);
    console.log(`  - ${tasks.length} tâches créées`);
    console.log(`  - Commentaires ajoutés sur les tâches`);
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .then(() => {
    console.log("✅ Script de seeding exécuté avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur lors de l'exécution du script:", error);
    process.exit(1);
  });
