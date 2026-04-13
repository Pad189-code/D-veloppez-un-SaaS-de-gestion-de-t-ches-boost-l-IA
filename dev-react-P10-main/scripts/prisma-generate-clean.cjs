/**
 * Supprime node_modules/.prisma puis lance prisma generate.
 * Sous Windows, si le moteur est verrouillé, utilisez scripts/force-prisma-generate.cmd
 * (fermer les terminaux dev / Prisma Studio avant).
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const prismaDir = path.join(root, "node_modules", ".prisma");

try {
  fs.rmSync(prismaDir, { recursive: true, force: true });
  console.log("[prisma] Dossier node_modules/.prisma supprimé.\n");
} catch (err) {
  console.error(
    "[prisma] Impossible de supprimer node_modules/.prisma :",
    err.message,
    "\n→ Fermez tous les terminaux (npm run dev, dev:web, prisma studio), puis relancez npm run db:generate",
    "\n→ Ou exécutez (double-clic) : scripts\\force-prisma-generate.cmd\n",
  );
  process.exit(1);
}

try {
  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
} catch {
  console.error(
    "\n[prisma] generate a échoué. Si EPERM sous Windows :",
    "\n  1) Fermez Cursor/VS Code ou arrêtez tous les serveurs Node",
    "\n  2) Lancez scripts\\force-prisma-generate.cmd depuis l’Explorateur (double-clic)",
    "\n  3) Ou invite CMD : cd ce dossier puis force-prisma-generate.cmd\n",
  );
  process.exit(1);
}
