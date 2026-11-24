import { NextResponse } from "next/server";

/*
 * CORS for the API.
 * The phone app does not need this, but the WEB version of the app runs on
 * another address (e.g. http://localhost:8081), and browsers block calls to
 * a different address unless the server allows it with these headers.
 * We only use tokens (no cookies), so allowing local development origins is safe.
 */

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "600",
};

// Extra allowed origins can be added in CORS_ORIGINS (comma-separated).
const extraOrigins = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);

function isAllowed(origin) {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || extraOrigins.includes(origin);
}

export function proxy(request) {
  const origin = request.headers.get("origin") || "";
  const allowOrigin = isAllowed(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};

  // Browsers first send an OPTIONS "preflight" request to ask for permission.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: { ...allowOrigin, ...corsHeaders } });
  }

  const response = NextResponse.next();
  Object.entries({ ...allowOrigin, ...corsHeaders }).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
