import type { NextRequest } from "next/server";
import { fail, json, preflight, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createUser } from "@/lib/users";
import { createUserToken, USER_COOKIE } from "@/lib/user-auth";
import { normalizePhone } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (rateLimit(`register:${clientIp(req)}`, 10, 10 * 60_000)) {
    return fail("Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.", 429);
  }

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phoneInput = typeof body.phone === "string" ? body.phone : "";
  const password = typeof body.password === "string" ? body.password : "";

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Ism-familiyani kiriting";
  const phone = normalizePhone(phoneInput);
  if (!phone) errors.phone = "Telefon raqamni to'liq kiriting";
  if (password.length < 6) errors.password = "Parol kamida 6 ta belgidan bo'lishi kerak";
  if (Object.keys(errors).length) return fail("Ma'lumotlarni tekshiring", 422, errors);

  const result = createUser(name, phone!, password);
  if (!result.ok) {
    return fail(result.message, 409, { phone: "Bu raqam allaqachon band" });
  }

  const token = await createUserToken(result.user);
  const res = json({ data: { user: result.user, token } }, 201);
  res.cookies.set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export function OPTIONS() {
  return preflight();
}
