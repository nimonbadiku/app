import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/db";
import { sessions } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    // Offline-only deployment: client uses localStorage, no server history.
    return NextResponse.json({ success: true, sessions: [], offline: true });
  }
  try {
    const db = getDb();
    const list = await db.select().from(sessions).orderBy(desc(sessions.startedAt));
    
    // Normalize numeric fields to numbers
    const formatted = list.map((s) => ({
      ...s,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      earnings: parseFloat(s.earnings || "0"),
      earningsPerItem: parseFloat(s.earningsPerItem || "20"),
    }));

    return NextResponse.json({ success: true, sessions: formatted });
  } catch (error: unknown) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json({ success: false, error: "Database error fetching sessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    // Offline-only: accept the write so the client never breaks, but persist
    // nothing server-side. The client keeps it in localStorage / offline queue.
    try {
      const body = await req.json();
      return NextResponse.json({ success: true, session: body, offline: true });
    } catch {
      return NextResponse.json({ success: true, offline: true });
    }
  }
  try {
    const db = getDb();
    const body = await req.json();
    const {
      id,
      startedAt,
      endedAt,
      durationSeconds,
      doors,
      yesCount,
      noCount,
      notHomeCount,
      itemsSold,
      earnings,
      currency,
      earningsPerItem,
      note,
      experiment,
    } = body;

    if (!id || !startedAt || !endedAt) {
      return NextResponse.json({ success: false, error: "Missing required session fields" }, { status: 400 });
    }

    const newRecord = {
      id,
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      durationSeconds: Math.max(0, parseInt(durationSeconds) || 0),
      doors: Math.max(0, parseInt(doors) || 0),
      yesCount: Math.max(0, parseInt(yesCount) || 0),
      noCount: Math.max(0, parseInt(noCount) || 0),
      notHomeCount: Math.max(0, parseInt(notHomeCount) || 0),
      itemsSold: Math.max(0, parseInt(itemsSold) || 0),
      earnings: (parseFloat(earnings) || 0).toFixed(2),
      currency: currency || "kr",
      earningsPerItem: (parseFloat(earningsPerItem) || 20).toFixed(2),
      note: note ? String(note).trim() : null,
      experiment: experiment ? String(experiment).trim() : null,
      createdAt: new Date(),
    };

    // Upsert session
    await db
      .insert(sessions)
      .values(newRecord)
      .onConflictDoUpdate({
        target: sessions.id,
        set: newRecord,
      });

    return NextResponse.json({ success: true, session: newRecord });
  } catch (error: unknown) {
    console.error("Failed to save session:", error);
    return NextResponse.json({ success: false, error: "Database error saving session" }, { status: 500 });
  }
}
