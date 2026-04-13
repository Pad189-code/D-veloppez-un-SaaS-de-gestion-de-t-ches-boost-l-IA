import "dotenv/config";
import { defineConfig } from "@prisma/config";

/** Même logique que prisma/schema.prisma : SQLite sous prisma/dev.db (chemin relatif à la racine du projet). */
const defaultSqliteUrl = "file:./prisma/dev.db";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? defaultSqliteUrl,
  },
});
