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
    const contentType = req.headers.get('content-type') || '';
    console.log('🔔 IPN reçu:', { contentType, rawSnippet: raw.slice(0, 200) });
    
    const signatureOk = verifyIpnSignature(req as Request, raw);
    console.log('🔐 Signature IPN:', signatureOk);
    
    // PayDunya envoie l'IPN en application/x-www-form-urlencoded (clé "data")
    let payload: Record<string, unknown> = {};
    const getString = (obj: Record<string, unknown>, key: string): string | undefined => {
      const v = obj[key];
      return typeof v === 'string' ? v : undefined;
    };
    try {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const form = new URLSearchParams(raw);
        const data = form.get('data');
        if (data) {
          // data contient généralement un JSON stringifié
          try {
            payload = JSON.parse(data);
          } catch {
            payload = { data };
          }
        } else {
          // Champs plats (ex: data[token], data[status], token, status, transaction_id)
          const flat = Object.fromEntries(form.entries());
          const normalized: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(flat)) {
            const m = k.match(/^data\[(.+)\]$/);
            if (m) {
              normalized[m[1]] = v;
            } else {
              normalized[k] = v;
            }
          }
          payload = normalized;
        }
      } else if (contentType.includes('application/json')) {
        payload = JSON.parse(raw || '{}');
      } else {
        // Fallback: tentative JSON puis key=value parsing simple
        try {
          payload = JSON.parse(raw || '{}');
        } catch {
          const form = new URLSearchParams(raw);
          payload = Object.fromEntries(form.entries());
        }
      }
    } catch (e) {
      console.error('❌ Erreur parsing IPN:', e);
      payload = {};
    }
    console.log('📦 Payload IPN (normalisé):', JSON.stringify(payload, null, 2));

    const providerRef =
      getString(payload, 'transaction_id') ||
      getString(payload, 'token') ||
      getString(payload, 'reference') ||
      'unknown';
    
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
    const token = getString(payload, 'token') || getString(payload, 'reference') || null;
    if (!token) return jsonRes({ ok:false, error:'No token' }, 400);

    const [pay] = await db.select().from(payments).where(eq(payments.providerToken, token));
    if (!pay) return jsonRes({ ok:false, error:'Payment not found' }, 404);

    // Traduire statut PayDunya vers notre statut
    const providerStatus = String(getString(payload, 'status') || '').toUpperCase(); // ex: COMPLETED/FAILED/CANCELLED/PAID
    let status: 'PENDING'|'COMPLETED'|'FAILED' = 'PENDING';
    if (providerStatus.includes('COMPLETE') || providerStatus === 'PAID' || providerStatus === 'SUCCESS') {
      status = 'COMPLETED';
    } else if (providerStatus.includes('CANCEL') || providerStatus.includes('FAIL')) {
      status = 'FAILED';
    }

    await db.update(payments).set({ status }).where(eq(payments.id, pay.id));

    if (status === 'COMPLETED') {
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