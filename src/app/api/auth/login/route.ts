import type { NextRequest } from "next/server";
import { AUTH_COOKIE, createToken } from "@/lib/auth";
import { fail, json, preflight, readJson } from "@/lib/http";
import { findAdminByEmail } from "@/lib/queries";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 12;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return fail("Juda ko'p urinish. 10 daqiqadan so'ng qayta urinib ko'ring.", 429);
  }

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const errors: Record<string, string> = {};
  if (!email) errors.email = "Emailni kiriting";
  if (!password) errors.password = "Parolni kiriting";
  if (Object.keys(errors).length) return fail("Ma'lumotlarni to'ldiring", 422, errors);

  const admin = await findAdminByEmail(email);
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return fail("Email yoki parol noto'g'ri", 401);
  }

  const token = await createToken({ id: admin.id, email: admin.email, name: admin.name });
  const res = json({
    data: {
      admin: { id: admin.id, email: admin.email, name: admin.name },
      token,
    },
  });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export function OPTIONS() {
  return preflight();
}
