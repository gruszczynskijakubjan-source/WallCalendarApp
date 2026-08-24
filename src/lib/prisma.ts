import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // The adapter resolves a relative "file:" URL against process.cwd(), unlike
  // Prisma's classic engine which resolves it against prisma/schema.prisma's
  // directory — so DATABASE_URL="file:./data/dev.db" would silently point at
  // a different, empty database if passed through as-is. Build an absolute
  // path from DATABASE_URL relative to the schema's directory to match the
  // classic engine's behavior and keep pointing at the real database file.
  const raw = process.env.DATABASE_URL ?? "file:./data/dev.db";
  const relative = raw.replace(/^file:/, "");
  const absolutePath = path.resolve(process.cwd(), "prisma", relative);
  const adapter = new PrismaBetterSQLite3({ url: `file:${absolutePath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
