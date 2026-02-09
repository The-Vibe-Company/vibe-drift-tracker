import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, asc, sql, and, gte, lte } from "drizzle-orm";
import { commits, fileChanges, apiKeys, type NewCommitRow, type NewFileChangeRow, type NewApiKeyRow } from "./schema";
import { computeVibeDriftScore, getVibeDriftLevel } from "@vibedrift/shared";

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const client = neon(databaseUrl);
  return drizzle(client);
}

export async function insertCommit(
  data: NewCommitRow,
  files?: NewFileChangeRow[],
) {
  const db = getDb();
  const [row] = await db.insert(commits).values(data).returning();

  if (files && files.length > 0 && row) {
    await db
      .insert(fileChanges)
      .values(files.map((f) => ({ ...f, commitId: row.id })));
  }

  return row;
}

export async function getCommits(filters?: {
  project?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
  userId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const db = getDb();
  const conditions = [];

  // Always exclude merge commits (no prompts, no drift value)
  conditions.push(sql`${commits.message} NOT LIKE 'Merge %'`);

  if (filters?.userId) {
    conditions.push(eq(commits.userId, filters.userId));
  }
  if (filters?.project) {
    conditions.push(eq(commits.projectName, filters.project));
  }
  if (filters?.since) {
    conditions.push(gte(commits.committedAt, new Date(filters.since)));
  }
  if (filters?.until) {
    const untilDate = new Date(filters.until);
    untilDate.setUTCHours(23, 59, 59, 999);
    conditions.push(lte(commits.committedAt, untilDate));
  }

  const sortDir = filters?.sortOrder === "asc" ? asc : desc;

  function getSortExpression() {
    switch (filters?.sortBy) {
      case "project": return sortDir(commits.projectName);
      case "drift": return sortDir(commits.vibeDriftScore);
      case "lines": return sortDir(sql`${commits.linesAdded} + ${commits.linesDeleted}`);
      case "prompts": return sortDir(commits.userPrompts);
      case "date": return sortDir(commits.committedAt);
      default: return desc(commits.committedAt);
    }
  }

  const query = db
    .select()
    .from(commits)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(getSortExpression())
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);

  return query;
}

export async function getCommitCount(filters?: {
  project?: string;
  since?: string;
  until?: string;
  userId?: string;
}): Promise<number> {
  const db = getDb();
  const conditions = [];

  conditions.push(sql`${commits.message} NOT LIKE 'Merge %'`);

  if (filters?.userId) {
    conditions.push(eq(commits.userId, filters.userId));
  }
  if (filters?.project) {
    conditions.push(eq(commits.projectName, filters.project));
  }
  if (filters?.since) {
    conditions.push(gte(commits.committedAt, new Date(filters.since)));
  }
  if (filters?.until) {
    const untilDate = new Date(filters.until);
    untilDate.setUTCHours(23, 59, 59, 999);
    conditions.push(lte(commits.committedAt, untilDate));
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commits)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result?.count ?? 0;
}

export async function getProjects(userId?: string) {
  const db = getDb();
  const result = await db
    .selectDistinct({ projectName: commits.projectName })
    .from(commits)
    .where(userId ? eq(commits.userId, userId) : undefined)
    .orderBy(commits.projectName);
  return result.map((r) => r.projectName);
}

export async function getCommitDetail(hash: string) {
  const db = getDb();
  const [commit] = await db
    .select()
    .from(commits)
    .where(eq(commits.commitHash, hash))
    .limit(1);
  if (!commit) return null;

  const files = await db
    .select()
    .from(fileChanges)
    .where(eq(fileChanges.commitId, commit.id));

  return { ...commit, fileChanges: files };
}

export async function getStats(project?: string, userId?: string) {
  const db = getDb();
  const conditions = [];
  // Always exclude merge commits (no prompts, no drift value)
  conditions.push(sql`${commits.message} NOT LIKE 'Merge %'`);
  if (project) conditions.push(eq(commits.projectName, project));
  if (userId) conditions.push(eq(commits.userId, userId));

  const [result] = await db
    .select({
      totalCommits: sql<number>`count(*)::int`,
      avgScore: sql<number>`coalesce(avg(${commits.vibeDriftScore}) filter (where ${commits.userPrompts} > 0), 0)`,
      totalLines: sql<number>`coalesce(sum(${commits.linesAdded}) + sum(${commits.linesDeleted}), 0)::int`,
      totalPrompts: sql<number>`coalesce(sum(${commits.userPrompts}), 0)::int`,
    })
    .from(commits)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result;
}

// --- API Key helpers ---

export async function hashApiKey(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createApiKey(data: NewApiKeyRow) {
  const db = getDb();
  const [row] = await db.insert(apiKeys).values(data).returning();
  return row;
}

export async function getApiKeysByUser(userId: string) {
  const db = getDb();
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function lookupApiKey(keyHash: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);
  return row ?? null;
}

export async function updateApiKeyLastUsed(id: number) {
  const db = getDb();
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, id));
}

export async function deleteCommit(id: number, userId: string) {
  const db = getDb();
  await db
    .delete(commits)
    .where(and(eq(commits.id, id), eq(commits.userId, userId)));
}

export async function deleteApiKey(id: number, userId: string) {
  const db = getDb();
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}

function isSystemGeneratedPrompt(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith("[Request interrupted by user")) return true;
  if (trimmed.startsWith("Implement the following plan:")) return true;
  if (trimmed.startsWith("<task-notification>")) return true;
  return false;
}

export async function cleanupSystemPrompts(userId: string) {
  const db = getDb();
  const allCommits = await db
    .select()
    .from(commits)
    .where(eq(commits.userId, userId));

  let updated = 0;

  for (const commit of allCommits) {
    const prompts = (commit.prompts ?? []) as Array<{ text: string; timestamp: string; sessionId: string }>;
    const filtered = prompts.filter((p) => !isSystemGeneratedPrompt(p.text));

    if (filtered.length === prompts.length) continue;

    const score = computeVibeDriftScore(filtered.length, commit.linesAdded ?? 0, commit.linesDeleted ?? 0);
    const level = getVibeDriftLevel(score);

    await db
      .update(commits)
      .set({
        prompts: filtered,
        userPrompts: filtered.length,
        totalInteractions: filtered.length + (commit.aiResponses ?? 0),
        vibeDriftScore: score,
        vibeDriftLevel: level,
      })
      .where(eq(commits.id, commit.id));

    updated++;
  }

  return { total: allCommits.length, updated };
}
