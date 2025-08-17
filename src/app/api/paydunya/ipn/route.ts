import { db } from '@/db/client';
import { auditLogs, entitlements, ipnEvents, payments } from '@/db/schema';
import { serverError } from '@/lib/http';
import { jsonRes } from '@/lib/logger';
import { verifyIpnSignature } from '@/lib/paydunya';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text(); // garder le raw pour signature
    const signatureOk = verifyIpnSignature(req as Request, raw);
    const payload = JSON.parse(raw || '{}');

    const providerRef = payload?.transaction_id || payload?.token || 'unknown';
    
    // idempotence
    try {
      await db.insert(ipnEvents).values({
        providerRef, 
        rawPayload: payload, 
        signatureOk
      });
    } catch {
      // en double → ok
      return jsonRes({ ok: true, duplicate: true }, 200);
    }

    // Trouver payment par token
    const token = payload?.token || payload?.reference || null;
    if (!token) return jsonRes({ ok:false, error:'No token' }, 400);

    const [pay] = await db.select().from(payments).where(eq(payments.providerToken, token));
    if (!pay) return jsonRes({ ok:false, error:'Payment not found' }, 404);

    // Traduire statut PayDunya vers notre statut
    const providerStatus = String(payload?.status || '').toUpperCase(); // ex: completed/failed/canceled
    let status: 'PENDING'|'PAID'|'CANCELED'|'EXPIRED' = 'PENDING';
    if (providerStatus.includes('COMPLETE') || providerStatus === 'PAID') status = 'PAID';
    else if (providerStatus.includes('CANCEL')) status = 'CANCELED';
    else if (providerStatus.includes('EXPIRE')) status = 'EXPIRED';

    await db.update(payments).set({ status }).where(eq(payments.id, pay.id));

    if (status === 'PAID') {
      // Grant entitlement
      const resourceId = pay.planId;
      await db
        .insert(entitlements)
        .values({ uid: pay.uid, resourceId, sourcePaymentId: pay.id })
        .onConflictDoUpdate({
          target: [entitlements.uid, entitlements.resourceId],
          set: { sourcePaymentId: pay.id },
        });

      await db.insert(auditLogs).values({
        uid: pay.uid, 
        action: 'ENTITLEMENT_GRANTED', 
        meta: { resourceId, paymentId: pay.id }
      });
    }

    return jsonRes({ ok: true });
  } catch (err: unknown) {
    return serverError(err);
  }
}

// Route legacy pour compatibilité
export async function OPTIONS() {
  return new Response(null, { 
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    }
  });
} 