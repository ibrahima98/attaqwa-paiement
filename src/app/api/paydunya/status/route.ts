import { db } from '@/db/client';
import { payments } from '@/db/schema';
import { badRequest, serverError } from '@/lib/http';
import { jsonRes } from '@/lib/logger';
import { rateLimit } from '@/lib/ratelimit';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!rateLimit(clientIp, 60, 60_000)) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const token = new URL(req.url).searchParams.get('token');
    if (!token) return badRequest('token required');
    
    const [row] = await db.select().from(payments).where(eq(payments.providerToken, token));
    if (!row) {
      // Inconnu côté DB → tenter une confirmation côté PayDunya (au cas où l'IPN n'est pas encore arrivé)
      const confirmed = await confirmWithPayDunya(token);
      if (!confirmed) return jsonRes({ status: 'UNKNOWN' }, 404);
      return jsonRes({ status: confirmed });
    }
    if (row.status !== 'PENDING') return jsonRes({ status: row.status });

    // Fallback: DB = PENDING → interroger PayDunya et mettre à jour si nécessaire
    const confirmed = await confirmWithPayDunya(token);
    if (confirmed && confirmed !== row.status) {
      await db.update(payments).set({ status: confirmed }).where(eq(payments.id, row.id));
      return jsonRes({ status: confirmed });
    }
    return jsonRes({ status: row.status });
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
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
    }
  });
} 

async function confirmWithPayDunya(token: string): Promise<'PENDING'|'COMPLETED'|'FAILED'|null> {
  try {
    const { PAYDUNYA_MODE, PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN } = process.env;
    if (!PAYDUNYA_MASTER_KEY || !PAYDUNYA_PRIVATE_KEY || !PAYDUNYA_TOKEN) return null;
    const BASE = PAYDUNYA_MODE === 'live'
      ? 'https://app.paydunya.com/api/v1'
      : 'https://app.paydunya.com/sandbox-api/v1';
    const headers = {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
      'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
      'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN,
    };
    const res = await fetch(`${BASE}/checkout-invoice/confirm/${token}`, { headers, method: 'GET' });
    const data: Record<string, unknown> = await res.json().catch(()=> ({} as Record<string, unknown>));
    log('Confirm PayDunya status response', { ok: res.ok, dataSnippet: JSON.stringify(data).slice(0, 300) });
    if (!res.ok) return null;
    if (data.response_code !== '00') return null;
    const topStatus = typeof data.status === 'string' ? data.status : '';
    const invoiceObj = typeof data.invoice === 'object' && data.invoice ? (data.invoice as Record<string, unknown>) : {};
    const invStatus = typeof invoiceObj.status === 'string' ? invoiceObj.status : '';
    const statusRaw: string = String(topStatus || invStatus || '').toUpperCase();
    if (statusRaw.includes('COMPLETE') || statusRaw === 'PAID' || statusRaw === 'SUCCESS' || statusRaw === 'COMPLETED') return 'COMPLETED';
    if (statusRaw.includes('CANCEL') || statusRaw.includes('FAIL')) return 'FAILED';
    return 'PENDING';
  } catch {
    return null;
  }
}