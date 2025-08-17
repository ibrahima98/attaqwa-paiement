export const log = (...args: any[]) => console.log('[AT-TAQWA]', ...args);
export const warn = (...args: any[]) => console.warn('[AT-TAQWA]', ...args);
export const error = (...args: any[]) => console.error('[AT-TAQWA]', ...args);

export function jsonRes(data: any, init?: number | ResponseInit) {
  const status = typeof init === 'number' ? init : (init as ResponseInit)?.status || 200;
  return Response.json(data, typeof init === 'number' ? { status: init } : init);
} 