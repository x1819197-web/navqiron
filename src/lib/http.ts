import { NextResponse } from "next/server";

const allowedOrigin = process.env.ADMIN_ORIGIN?.trim();

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    ...(allowedOrigin ? { Vary: "Origin" } : {}),
  };
}

export function json(data: unknown, init: number | ResponseInit = 200): NextResponse {
  const status = typeof init === "number" ? init : (init.status ?? 200);
  const headers = new Headers(typeof init === "object" ? init.headers : undefined);
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return NextResponse.json(data, { status, headers });
}

export function fail(
  message: string,
  status = 400,
  details?: Record<string, string>,
): NextResponse {
  return json(
    { error: { message, ...(details ? { details } : {}) } },
    status,
  );
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
