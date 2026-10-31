import type { NextRequest } from "next/server";
import { json, preflight } from "@/lib/http";
import { listCategories } from "@/lib/queries";
import type { CategoryKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const validKind = kind === "event" || kind === "place" ? (kind as CategoryKind) : undefined;
  const categories = await listCategories(validKind);
  return json({ data: categories, meta: { total: categories.length } });
}

export function OPTIONS() {
  return preflight();
}
