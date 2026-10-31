import { json, preflight } from "@/lib/http";
import { USER_COOKIE } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = json({ ok: true });
  res.cookies.set(USER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export function OPTIONS() {
  return preflight();
}
