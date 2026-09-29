import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    // Offline-only deployment: no database, app runs on localStorage.
    return Response.json({ ok: true, offline: true });
  }
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
