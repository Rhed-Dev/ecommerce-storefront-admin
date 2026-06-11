import { PrismaClient } from "@prisma/client";

/**
 * Lazy Prisma singleton.
 *
 * The client is constructed on first use inside a request handler — never at
 * module import time — so `next build` works with no database and no
 * DATABASE_URL. The instance is cached on `globalThis` to survive hot reloads
 * in development without exhausting the connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Run a storefront query and fall back to a default when the database is
 * unreachable. Used only on public catalog pages so a cloner who runs
 * `npm run dev` before `docker compose up -d` sees graceful empty states
 * instead of a crash. Admin and checkout paths intentionally surface errors.
 */
export async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[storefront] database query failed:", error);
    return fallback;
  }
}
