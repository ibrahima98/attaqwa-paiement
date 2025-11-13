import { db } from '@/db/client';
import { payments } from '@/db/schema';
import { jsonRes } from '@/lib/logger';
import { rateLimit } from '@/lib/ratelimit';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!rateLimit(clientIp, 60, 60_000)) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Récupérer tous les paiements
    const allPayments = await db.select().from(payments).orderBy(payments.createdAt);
    
    return jsonRes({ 
      payments: allPayments,
      total: allPayments.length
    });
  } catch (err: unknown) {
    return Response.json({ error: 'Server Error', detail: String(err) }, { status: 500 });
  }
}

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
 
 