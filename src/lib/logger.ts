export const log = (...args: unknown[]) => console.log('[AT-TAQWA]', ...args);
export const warn = (...args: unknown[]) => console.warn('[AT-TAQWA]', ...args);
export const error = (...args: unknown[]) => console.error('[AT-TAQWA]', ...args);

export function jsonRes(data: unknown, init?: number | ResponseInit) {
  const status = typeof init === 'number' ? init : (init as ResponseInit)?.status || 200;
  return Response.json(data, typeof init === 'number' ? { status: init } : init);
} 