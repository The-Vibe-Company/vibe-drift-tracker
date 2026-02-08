import { NextRequest, NextResponse } from "next/server";
import {
  type CommitPayload,
  computeVibeDriftScore,
  getVibeDriftLevel,
} from "@vibedrift/shared";
import { insertCommit, getCommits, hashApiKey, lookupApiKey, updateApiKeyLastUsed } from "@/lib/db";
import type { NewFileChangeRow } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";

async function resolveUser(request: NextRequest): Promise<string | null> {
  // 1. Bearer token → hash → lookup api_keys → userId
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ") && authHeader.length > 7) {
    const token = authHeader.slice(7);
    const keyHash = await hashApiKey(token);
    const apiKey = await lookupApiKey(keyHash);
    if (apiKey) {
      updateApiKeyLastUsed(apiKey.id).catch(() => {});
      return apiKey.userId;
    }
    return null;
  }

  // 2. Session cookie → userId
  const { data: session } = await auth.getSession();
  return session?.user?.id ?? null;
}

export async function POST(request: NextRequest) {
  const userId = await resolveUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload: CommitPayload = await request.json();

    if (!payload.commitHash || !payload.projectName) {
      return NextResponse.json(
        { error: "commitHash and projectName are required" },
        { status: 400 },
      );
    }

    const cleanedPrompts = payload.prompts ?? [];
    const userPrompts = cleanedPrompts.length;

    const score = computeVibeDriftScore(
      userPrompts,
      payload.linesAdded,
      payload.linesDeleted,
    );
    const level = getVibeDriftLevel(score);

    const row = await insertCommit(
      {
        commitHash: payload.commitHash,
        message: payload.message,
        author: payload.author,
        branch: payload.branch,
        committedAt: new Date(payload.committedAt),
        projectName: payload.projectName,
        remoteUrl: payload.remoteUrl,
        userPrompts,
        aiResponses: payload.aiResponses,
        totalInteractions: payload.totalInteractions,
        toolCalls: payload.toolCalls,
        filesChanged: payload.filesChanged,
        linesAdded: payload.linesAdded,
        linesDeleted: payload.linesDeleted,
        vibeDriftScore: score,
        vibeDriftLevel: level,
        source: payload.source,
        sessionIds: payload.sessionIds,
        prompts: cleanedPrompts,
        userId,
      },
      payload.fileChanges?.map(
        (f): Omit<NewFileChangeRow, "commitId"> & { commitId: number } => ({
          commitId: 0, // Will be set by insertCommit
          filePath: f.filePath,
          linesAdded: f.linesAdded,
          linesDeleted: f.linesDeleted,
          status: f.status,
        }),
      ),
    );

    return NextResponse.json({ ...row, vibeDriftScore: score, vibeDriftLevel: level });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    // Handle unique constraint violations
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "Commit already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const rows = await getCommits({
      userId: session.user.id,
      project: searchParams.get("project") ?? undefined,
      since: searchParams.get("since") ?? undefined,
      until: searchParams.get("until") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
    });
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
