import "dotenv/config";
import { defineConfig } from "@prisma/config";

/** SQLite : `DATABASE_URL` à la racine (`.env`), sinon `prisma/dev.db`. */
const defaultSqliteUrl = "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL?.trim() || defaultSqliteUrl,
  },
});
