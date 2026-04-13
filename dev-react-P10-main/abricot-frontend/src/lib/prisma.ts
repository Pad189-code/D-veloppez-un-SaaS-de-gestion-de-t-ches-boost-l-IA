import { PrismaClient } from '@prisma/client';

/** Singleton Prisma en dev pour éviter d’ouvrir trop de connexions au rechargement à chaud. */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
