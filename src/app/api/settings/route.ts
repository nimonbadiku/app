import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
  id: "default",
  earningsPerItem: 20,
  pricePerItem: 50,
  currency: "kr",
};

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS, offline: true });
  }
  try {
    const db = getDb();
    const [row] = await db.select().from(userSettings).where(eq(userSettings.id, "default"));
    if (!row) {
      return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
    }
    return NextResponse.json({
      success: true,
      settings: {
        id: row.id,
        earningsPerItem: parseFloat(row.earningsPerItem || "20"),
        pricePerItem: parseFloat(row.pricePerItem || "50"),
        currency: row.currency || "kr",
      },
    });
  } catch (error: unknown) {
    console.error("Failed to get settings:", error);
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const earningsPerItem = parseFloat(body.earningsPerItem) || 20;
    const pricePerItem = parseFloat(body.pricePerItem) || 50;
    const currency = body.currency ? String(body.currency).trim() : "kr";

    if (!isDbConfigured()) {
      return NextResponse.json({
        success: true,
        settings: { id: "default", earningsPerItem, pricePerItem, currency },
        offline: true,
      });
    }

    const db = getDb();
    const payload = {
      id: "default",
      earningsPerItem: earningsPerItem.toFixed(2),
      pricePerItem: pricePerItem.toFixed(2),
      currency: currency,
      updatedAt: new Date(),
    };

    await db
      .insert(userSettings)
      .values(payload)
      .onConflictDoUpdate({
        target: userSettings.id,
        set: payload,
      });

    return NextResponse.json({
      success: true,
      settings: {
        id: "default",
        earningsPerItem,
        pricePerItem,
        currency,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}
