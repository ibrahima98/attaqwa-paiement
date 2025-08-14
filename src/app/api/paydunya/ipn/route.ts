import { db } from "@/db/client";
import { entitlements, payments } from "@/db/schema";
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

export async function POST(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));

    const status = data?.status || data?.invoice?.status;
    const userId = data?.custom_data?.userId || data?.invoice?.custom_data?.userId;
    const token = data?.token || data?.invoice?.token || data?.invoice_token;

    if (!userId) {
      return NextResponse.json({ error: "userId missing in IPN payload" }, { status: 400, headers: CORS });
    }

    if (status === "completed" || status === "confirmed") {
      await db.insert(entitlements)
        .values({ userId, part2: true, part3: true })
        .onConflictDoUpdate({ target: entitlements.userId, set: { part2: true, part3: true } });

      if (token) {
        await db.update(payments).set({ status: "confirmed", providerData: JSON.stringify(data) })
          .where(eq(payments.token, token));
      }
    } else if (status === "canceled" || status === "failed") {
      if (token) {
        await db.update(payments).set({ status, providerData: JSON.stringify(data) })
          .where(eq(payments.token, token));
      }
    }

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "IPN error";
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: CORS });
  }
} 