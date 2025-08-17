import { NextRequest } from 'next/server';
import { verifyIdToken } from './firebaseAdmin';

export async function requireUser(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new Error('UNAUTHORIZED');
  const decoded = await verifyIdToken(token);
  return decoded.uid; // userId
} 