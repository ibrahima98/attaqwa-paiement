import { db } from '@/db/client';
import { entitlements, payments } from '@/db/schema';
import { badRequest, serverError } from '@/lib/http';
import { jsonRes } from '@/lib/logger';
import { rateLimit } from '@/lib/ratelimit';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!rateLimit(clientIp, 10, 60_000)) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { token, planId } = await req.json();
    if (!token || !planId) return badRequest('token and planId required');
    
    // Vérifier que le paiement existe
    const [payment] = await db.select().from(payments).where(eq(payments.providerToken, token));
    if (!payment) return jsonRes({ error: 'Payment not found' }, 404);
    
    // Mettre à jour le statut du paiement
    await db.update(payments)
      .set({ status: 'COMPLETED' })
      .where(eq(payments.providerToken, token));
    
    // Créer l'entitlement
    await db.insert(entitlements).values({
      uid: payment.uid,
      resourceId: planId,
      grantedAt: new Date(),
      sourcePaymentId: payment.id,
    }).onConflictDoUpdate({
      target: [entitlements.uid, entitlements.resourceId],
      set: {
        grantedAt: new Date(),
        sourcePaymentId: payment.id,
      }
    });
    
    return jsonRes({ 
      success: true, 
      message: 'Payment completed and entitlement granted' 
    });
  } catch (err: unknown) {
    return serverError(err);
  }
}

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
 
import { entitlements, payments } from '@/db/schema';
import { badRequest, serverError } from '@/lib/http';
import { jsonRes } from '@/lib/logger';
import { rateLimit } from '@/lib/ratelimit';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!rateLimit(clientIp, 10, 60_000)) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { token, planId } = await req.json();
    if (!token || !planId) return badRequest('token and planId required');
    
    // Vérifier que le paiement existe
    const [payment] = await db.select().from(payments).where(eq(payments.providerToken, token));
    if (!payment) return jsonRes({ error: 'Payment not found' }, 404);
    
    // Mettre à jour le statut du paiement
    await db.update(payments)
      .set({ status: 'COMPLETED' })
      .where(eq(payments.providerToken, token));
    
    // Créer l'entitlement
    await db.insert(entitlements).values({
      uid: payment.uid,
      resourceId: planId,
      grantedAt: new Date(),
      sourcePaymentId: payment.id,
    }).onConflictDoUpdate({
      target: [entitlements.uid, entitlements.resourceId],
      set: {
        grantedAt: new Date(),
        sourcePaymentId: payment.id,
      }
    });
    
    return jsonRes({ 
      success: true, 
      message: 'Payment completed and entitlement granted' 
    });
  } catch (err: unknown) {
    return serverError(err);
  }
}

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
 
 
 