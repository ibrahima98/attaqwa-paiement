export function badRequest(msg='Bad Request'){ return Response.json({error:msg},{status:400});}
export function unauthorized(){ return Response.json({error:'Unauthorized'},{status:401});}
export function forbidden(){ return Response.json({error:'Forbidden'},{status:403});}
export function serverError(err:any){ return Response.json({error:'Server Error', detail:String(err)}, {status:500});} 