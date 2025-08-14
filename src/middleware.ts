import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Paydunya-Private-Key, Paydunya-Token, Paydunya-Master-Key");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return res;
}

export const config = { matcher: ["/api/:path*"] }; 