import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { commits, fileChanges, type NewCommitRow, type NewFileChangeRow } from "./schema";

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
}) {
  const db = getDb();
  const conditions = [];

  if (filters?.project) {
    conditions.push(eq(commits.projectName, filters.project));
  }
  if (filters?.since) {
    conditions.push(gte(commits.committedAt, new Date(filters.since)));
  }
  if (filters?.until) {
    conditions.push(lte(commits.committedAt, new Date(filters.until)));
  }

  const query = db
    .select()
    .from(commits)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(commits.committedAt))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);

  return query;
}

export async function getProjects() {
  const db = getDb();
  const result = await db
    .selectDistinct({ projectName: commits.projectName })
    .from(commits)
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

export async function getStats(project?: string) {
  const db = getDb();
  const condition = project ? eq(commits.projectName, project) : undefined;

  const [result] = await db
    .select({
      totalCommits: sql<number>`count(*)::int`,
      avgScore: sql<number>`coalesce(avg(${commits.vibeDriftScore}), 0)`,
      totalLines: sql<number>`coalesce(sum(${commits.linesAdded}) + sum(${commits.linesDeleted}), 0)::int`,
      totalPrompts: sql<number>`coalesce(sum(${commits.userPrompts}), 0)::int`,
    })
    .from(commits)
    .where(condition);

  return result;
}
