import Database from "better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  const dbPath = raw.replace(/^file:/, "").replace(/^\.\//, "");
  // Resolve relative to project root
  const fullPath = dbPath.startsWith("/") ? dbPath : process.cwd() + "/" + dbPath;
  const adapter = new PrismaBetterSqlite3({ url: fullPath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
