import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAccountStats } from "@/lib/db";

export const dynamic = "force-dynamic";

function tokenMatches(provided: string, expected: string) {
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

function isAuthorized(request: Request) {
  const expected = process.env.STATS_TOKEN?.trim();
  if (!expected) return false;

  const header = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) return false;
  return tokenMatches(match[1], expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  try {
    const stats = await getAccountStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/stats failed", error);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 },
    );
  }
}
