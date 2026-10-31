import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserAccount } from "./types";

export const USER_COOKIE = "navqiron_user";

const DEV_SECRET = "navqiron-local-development-secret-please-change";
const key = new TextEncoder().encode(process.env.AUTH_SECRET || DEV_SECRET);

const TOKEN_TTL = "30d";

export async function createUserToken(user: UserAccount): Promise<string> {
  return new SignJWT({
    name: user.name,
    phone: user.phone,
    createdAt: user.createdAt,
    role: "user",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(key);
}

export async function verifyUserToken(token?: string | null): Promise<UserAccount | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (!payload.sub || payload.role !== "user") return null;
    return {
      id: Number(payload.sub),
      name: String(payload.name ?? ""),
      phone: String(payload.phone ?? ""),
      createdAt: String(payload.createdAt ?? ""),
    };
  } catch {
    return null;
  }
}

export async function getUserSession(): Promise<UserAccount | null> {
  try {
    const store = await cookies();
    return verifyUserToken(store.get(USER_COOKIE)?.value);
  } catch {
    return null;
  }
}
