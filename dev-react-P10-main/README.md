# OpenClassrooms - Backend Abricot

Cette base de code est l'API REST complète pour l'authentification et la gestion de projets avec système de rôles et de permissions pour le projet Abricot.

## Structure du dépôt

- **Racine** : API Express (`src/`) et **Prisma** unique (`prisma/schema.prisma`, migrations, base SQLite `prisma/dev.db`).
- **abricot-frontend** : application Next.js, déclarée comme [workspace npm](https://docs.npmjs.com/cli/using-npm/workspaces) dans le `package.json` racine.
- **`npm install`** à la racine installe l’API et le frontend ; le script `postinstall` exécute `prisma generate`.
- **Démarrage** : `npm run dev` lance l’API (port 8000 par défaut) ; `npm run dev:web` lance le frontend Next.js.

## Installation et Démarrage

1. Installer les dépendances :

```bash
npm install
```

2. Configurer la base de données :

```bash
npx prisma generate
npx prisma db push
```

3. Démarrer le serveur :

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:8000`

## Visualisation de la base de données

Vous pouvez visualiser votre base de données avec Prisma Studio :

```bash
npm run db:studio
```

Puis ouvrez **http://127.0.0.1:5555** dans le navigateur (port défini dans le script `db:studio`).

## Documentation

Ce projet utilise Swagger/OpenAPI pour documenter l'API backend de manière interactive et à jour.

## 🚀 Accès à la documentation

### URL de la documentation

```
http://localhost:8000/api-docs
```

### Prérequis

- Serveur backend démarré (`npm run dev`)
- Base de données accessible

## Seed de la database

Il existe un script pour peupler la base de données avec des données de test réalistes pour tester toutes les fonctionnalités de l'application.

## 🚀 Utilisation

### Exécuter le script de seeding

```bash
npm run seed
```

## 📊 Données générées

Le script crée les éléments suivants :

### 👥 Utilisateurs (10)

- **Alice Martin** (alice@example.com) - Propriétaire principal
- **Bob Dupont** (bob@example.com)
- **Caroline Leroy** (caroline@example.com)
- **David Moreau** (david@example.com)
- **Emma Rousseau** (emma@example.com)
- **François Dubois** (francois@example.com)
- **Gabrielle Simon** (gabrielle@example.com)
- **Henri Laurent** (henri@example.com)
- **Isabelle Petit** (isabelle@example.com)
- **Jacques Durand** (jacques@example.com)

**Mot de passe pour tous les utilisateurs :** `password123`

## Système de Rôles

### Rôles Utilisateur

- **Administrateur de projet** : Peut éditer, supprimer le projet, créer et supprimer des tâches
- **Contributeur** : Peut créer et supprimer des tâches
- **Aucun accès** : Ne peut pas accéder au projet

### Permissions par Rôle

| Action                        | Propriétaire | Admin | Contributeur |
| ----------------------------- | ------------ | ----- | ------------ |
| Créer un projet               | ✅           | ❌    | ❌           |
| Modifier le projet            | ✅           | ✅    | ❌           |
| Supprimer le projet           | ✅           | ❌    | ❌           |
| Ajouter/Retirer contributeurs | ✅           | ✅    | ❌           |
| Lister les tâches d'un projet | ✅           | ✅    | ✅           |
| Créer des tâches              | ✅           | ✅    | ✅           |
| Modifier des tâches           | ✅           | ✅    | ✅           |
| Supprimer des tâches          | ✅           | ✅    | ✅           |
