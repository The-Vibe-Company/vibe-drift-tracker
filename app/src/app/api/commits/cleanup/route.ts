import { NextResponse } from "next/server";
import { cleanupSystemPrompts } from "@/lib/db";
import { auth } from "@/lib/auth/server";

export async function POST() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupSystemPrompts(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
