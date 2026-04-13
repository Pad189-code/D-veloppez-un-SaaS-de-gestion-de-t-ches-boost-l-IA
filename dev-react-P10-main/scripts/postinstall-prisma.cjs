/**
 * Évite d'échouer tout `npm install` si `prisma generate` ne peut pas
 * remplacer query_engine (EPERM sous Windows : fichier verrouillé par un autre Node).
 */
const { execSync } = require("child_process");

try {
  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: __dirname + "/..",
    env: process.env,
  });
} catch {
  console.warn(
    "\n[prisma] generate ignoré (souvent EPERM sous Windows).",
    "Arrêtez les serveurs (npm run dev, dev:web, prisma studio), puis : npx prisma generate\n",
  );
  process.exit(0);
}
