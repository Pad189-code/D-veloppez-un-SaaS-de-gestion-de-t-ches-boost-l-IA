import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma-generated';

/** Même DB que l’API (fichier à la racine du monorepo) si `DATABASE_URL` absent. */
const defaultSqliteUrl = 'file:../prisma/dev.db';
const databaseUrl = process.env.DATABASE_URL?.trim() || defaultSqliteUrl;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
}

/** Singleton Prisma en dev pour éviter d’ouvrir trop de connexions au rechargement à chaud. */
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
