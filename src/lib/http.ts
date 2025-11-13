export function badRequest(msg='Bad Request'){ return Response.json({error:msg},{status:400});}
export function unauthorized(){ return Response.json({error:'Unauthorized'},{status:401});}
export function forbidden(){ return Response.json({error:'Forbidden'},{status:403});}
export function serverError(err: unknown) {
  const payload =
    err instanceof Error
      ? { error: 'Server Error', message: err.message, stack: err.stack }
      : { error: 'Server Error', message: String(err) };
  // Réponse plus verbeuse temporaire pour diagnostic
  return Response.json(payload, { status: 500 });
}