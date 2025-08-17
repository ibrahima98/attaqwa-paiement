const ALLOWED = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
export function withCors(res: Response) {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', ALLOWED.length ? ALLOWED[0] : '*');
  headers.set('Vary', 'Origin');
  return new Response(res.body, { status: res.status, headers });
} 