import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { hashApiKey, createApiKey, getApiKeysByUser } from "@/lib/db";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await getApiKeysByUser(session.user.id);
  return NextResponse.json(keys);
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const raw = `vdt_${crypto.randomUUID().replace(/-/g, "")}`;
  const keyHash = await hashApiKey(raw);

  const row = await createApiKey({
    keyHash,
    userId: session.user.id,
    name: name.trim(),
  });

  return NextResponse.json({ id: row.id, name: row.name, key: raw });
}
