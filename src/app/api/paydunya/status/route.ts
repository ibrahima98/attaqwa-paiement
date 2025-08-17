import { db } from '@/db/client';
import { payments } from '@/db/schema';
import { badRequest, serverError } from '@/lib/http';
import { jsonRes } from '@/lib/logger';
import { rateLimit } from '@/lib/ratelimit';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

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
    if (!row) return jsonRes({ status: 'UNKNOWN' }, 404);
    
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