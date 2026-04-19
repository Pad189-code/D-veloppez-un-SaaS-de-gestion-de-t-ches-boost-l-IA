"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("../generated/prisma/client");
dotenv_1.default.config({
    path: path_1.default.join(process.cwd(), ".env"),
    override: true,
});
const defaultUrl = "file:./prisma/dev.db";
const databaseUrl = process.env.DATABASE_URL?.trim() || defaultUrl;
const globalForPrisma = globalThis;
function createClient() {
    const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: databaseUrl });
    return new client_1.PrismaClient({ adapter });
}
exports.prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
//# sourceMappingURL=prismaSingleton.js.map