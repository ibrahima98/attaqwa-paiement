import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // CORS configuration
  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
  const origin = req.headers.get('origin');
  
  if (allowedOrigins.length > 0 && origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    res.headers.set("Access-Control-Allow-Origin", "*");
  }
  
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Vary", "Origin");
  
  return res;
}

export const config = { matcher: ["/api/:path*"] }; 