import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

export const commits = pgTable(
  "commits",
  {
    id: serial("id").primaryKey(),
    commitHash: text("commit_hash").notNull(),
    message: text("message").notNull(),
    author: text("author").notNull(),
    branch: text("branch").notNull(),
    committedAt: timestamp("committed_at", { withTimezone: true }).notNull(),
    projectName: text("project_name").notNull(),
    remoteUrl: text("remote_url"),
    userPrompts: integer("user_prompts").default(0),
    aiResponses: integer("ai_responses").default(0),
    totalInteractions: integer("total_interactions").default(0),
    toolCalls: integer("tool_calls").default(0),
    filesChanged: integer("files_changed").default(0),
    linesAdded: integer("lines_added").default(0),
    linesDeleted: integer("lines_deleted").default(0),
    vibeDriftScore: real("vibe_drift_score").default(0),
    vibeDriftLevel: text("vibe_drift_level").default("low"),
    source: text("source").default("manual"),
    sessionIds: jsonb("session_ids").$type<string[]>().default([]),
    prompts: jsonb("prompts").$type<Array<{ text: string; timestamp: string; sessionId: string }>>().default([]),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow(),
    userId: text("user_id"),
  },
  (table) => [unique("commits_hash_project_unique").on(table.commitHash, table.projectName)],
);

export const fileChanges = pgTable("file_changes", {
  id: serial("id").primaryKey(),
  commitId: integer("commit_id")
    .references(() => commits.id, { onDelete: "cascade" })
    .notNull(),
  filePath: text("file_path").notNull(),
  linesAdded: integer("lines_added").default(0),
  linesDeleted: integer("lines_deleted").default(0),
  status: text("status").default("modified"),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  keyHash: text("key_hash").notNull().unique(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export type ApiKeyRow = typeof apiKeys.$inferSelect;
export type NewApiKeyRow = typeof apiKeys.$inferInsert;

export type CommitRow = typeof commits.$inferSelect;
export type NewCommitRow = typeof commits.$inferInsert;
export type FileChangeRow = typeof fileChanges.$inferSelect;
export type NewFileChangeRow = typeof fileChanges.$inferInsert;
