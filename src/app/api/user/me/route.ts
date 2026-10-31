import type { NextRequest } from "next/server";
import { fail, json, preflight } from "@/lib/http";
import { countUserRegistrations } from "@/lib/users";
import { verifyUserToken, USER_COOKIE } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await verifyUserToken(req.cookies.get(USER_COOKIE)?.value);
  if (!user) return fail("Avtorizatsiya talab qilinadi", 401);
  return json({ data: { user, registrations: countUserRegistrations(user.phone) } });
}

export function OPTIONS() {
  return preflight();
}
