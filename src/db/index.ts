import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Optional DB: offline-only deployments (e.g. Vercel without DATABASE_URL)
// must still build and run using localStorage. Never throw at import time.
const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __doortrackPool?: Pool;
};

function getPool(): Pool | null {
  if (!databaseUrl) return null;
  if (!globalForDb.__doortrackPool) {
    globalForDb.__doortrackPool = new Pool({ connectionString: databaseUrl });
  }
  return globalForDb.__doortrackPool;
}

export function isDbConfigured(): boolean {
  return Boolean(databaseUrl);
}

export function getDb() {
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is not configured (offline mode)");
  }
  return drizzle(pool);
}

// Lazily-created pool (null in offline mode). Importing this file is safe
// without DATABASE_URL so `next build` succeeds on Vercel with zero env vars.
export const pool: Pool | null = getPool();
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
