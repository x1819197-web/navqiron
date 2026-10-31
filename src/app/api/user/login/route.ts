import type { NextRequest } from "next/server";
import { fail, json, preflight, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { authenticateUser } from "@/lib/users";
import { createUserToken, USER_COOKIE } from "@/lib/user-auth";
import { normalizePhone } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (rateLimit(`user-login:${clientIp(req)}`, 12, 10 * 60_000)) {
    return fail("Juda ko'p urinish. 10 daqiqadan so'ng qayta urinib ko'ring.", 429);
  }

  const body = await readJson(req);
  if (!body) return fail("JSON so'rov yuborilishi kerak", 400);

  const phoneInput = typeof body.phone === "string" ? body.phone : "";
  const password = typeof body.password === "string" ? body.password : "";

  const errors: Record<string, string> = {};
  const phone = normalizePhone(phoneInput);
  if (!phone) errors.phone = "Telefon raqamni to'g'ri kiriting";
  if (!password) errors.password = "Parolni kiriting";
  if (Object.keys(errors).length) return fail("Ma'lumotlarni to'ldiring", 422, errors);

  const user = authenticateUser(phone!, password);
  if (!user) return fail("Telefon raqam yoki parol noto'g'ri", 401);

  const token = await createUserToken(user);
  const res = json({ data: { user, token } });
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
