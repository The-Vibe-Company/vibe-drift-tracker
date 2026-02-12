import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { markSetupComplete } from "@/lib/db";

export async function POST() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markSetupComplete(session.user.id);
  return NextResponse.json({ ok: true });
}
