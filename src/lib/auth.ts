import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AdminUser } from "./types";

export const AUTH_COOKIE = "navqiron_session";

const DEV_SECRET = "navqiron-local-development-secret-please-change";
const SECRET = process.env.AUTH_SECRET || DEV_SECRET;
const key = new TextEncoder().encode(SECRET);

const TOKEN_TTL = "7d";

export async function createToken(admin: AdminUser): Promise<string> {
  return new SignJWT({ email: admin.email, name: admin.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(admin.id))
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(key);
}

export async function verifyToken(token?: string | null): Promise<AdminUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (!payload.sub) return null;
    return {
      id: Number(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? "Administrator"),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminUser | null> {
  try {
    const store = await cookies();
    return verifyToken(store.get(AUTH_COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(req: Request): Promise<AdminUser | null> {
  const header = req.headers.get("authorization");
  let token: string | undefined;
  if (header && header.toLowerCase().startsWith("bearer ")) {
    token = header.slice(7).trim();
  }
  if (!token) {
    try {
      const store = await cookies();
      token = store.get(AUTH_COOKIE)?.value;
    } catch {
      token = undefined;
    }
  }
  return verifyToken(token);
}
