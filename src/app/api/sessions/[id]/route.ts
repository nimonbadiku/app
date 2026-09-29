import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, error: "Not found (offline mode)" }, { status: 404 });
  }
  try {
    const { id } = await params;
    const db = getDb();
    const [found] = await db.select().from(sessions).where(eq(sessions.id, id));

    if (!found) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const formatted = {
      ...found,
      startedAt: found.startedAt.toISOString(),
      endedAt: found.endedAt.toISOString(),
      createdAt: found.createdAt.toISOString(),
      earnings: parseFloat(found.earnings || "0"),
      earningsPerItem: parseFloat(found.earningsPerItem || "20"),
    };

    return NextResponse.json({ success: true, session: formatted });
  } catch (error: unknown) {
    console.error("Failed to get session:", error);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, offline: true });
  }
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, id));
    return NextResponse.json({ success: true, message: "Session deleted" });
  } catch (error: unknown) {
    console.error("Failed to delete session:", error);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}
