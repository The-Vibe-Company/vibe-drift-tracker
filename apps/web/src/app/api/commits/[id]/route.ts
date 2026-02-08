import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { deleteCommit } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const commitId = parseInt(id, 10);
  if (isNaN(commitId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await deleteCommit(commitId, session.user.id);
  return NextResponse.json({ ok: true });
}
