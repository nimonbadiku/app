import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Seeding is permanently disabled: the app always starts fresh with zero
// demo/filler sessions. Kept as a route so old clients don't 404.
export async function POST() {
  return NextResponse.json(
    { success: false, seeded: false, disabled: true, message: "Demo seeding is disabled" },
    { status: 410 }
  );
}
