import { db } from "@/db/client";
import { entitlements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Paydunya-Private-Key, Paydunya-Token, Paydunya-Master-Key",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400, headers: CORS });
    }
    const rows = await db.select().from(entitlements).where(eq(entitlements.userId, userId));
    let row = rows[0];
    if (!row) {
      await db.insert(entitlements).values({ userId, part2: false, part3: false });
      const created = await db.select().from(entitlements).where(eq(entitlements.userId, userId));
      row = created[0];
    }
    return NextResponse.json(
      { userId, access: { part2: row.part2, part3: row.part3 }, updatedAt: row.updatedAt },
      { headers: CORS }
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: CORS });
  }
} 