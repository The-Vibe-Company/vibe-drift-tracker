import * as fs from "fs";
import * as path from "path";
import { SessionStats, PromptDetail } from "./types";

interface SessionIndexFile {
  version: number;
  entries: Array<{
    sessionId: string;
    fullPath: string;
    fileMtime: number;
    messageCount: number;
    created: string;
    modified: string;
    projectPath: string;
  }>;
  originalPath: string;
}

interface JSONLMessage {
  type: string;
  isMeta?: boolean;
  isSidechain?: boolean;
  timestamp?: string;
  uuid?: string;
  sessionId?: string;
  message?: {
    role: string;
    content: string | Array<{ type: string; text?: string; id?: string }>;
  };
}

function isCommand(content: string | Array<{ type: string; text?: string }>): boolean {
  const text = typeof content === "string" ? content : content.map((c) => c.text || "").join("");
  return text.includes("<command-name>") || text.includes("<local-command");
}

function isSystemGenerated(
  content: string | Array<{ type: string; text?: string }>,
): boolean {
  const text =
    typeof content === "string"
      ? content
      : content.map((c) => c.text || "").join("");
  const trimmed = text.trim();

  if (trimmed === "[Request interrupted by user]") return true;
  if (trimmed.startsWith("[Request interrupted by user for tool use]")) return true;
  if (trimmed.startsWith("Implement the following plan:")) return true;
  if (trimmed.startsWith("<task-notification>")) return true;

  return false;
}

/**
 * Strip the "[Request interrupted by user]" prefix from a message
 * that also contains real user text (mid-processing interruption).
 */
function stripInterruptPrefix(text: string): string {
  const prefix = "[Request interrupted by user]";
  if (text.startsWith(prefix)) {
    return text.slice(prefix.length).trim();
  }
  return text;
}

function countToolUses(
  content: string | Array<{ type: string; id?: string }>,
): number {
  if (typeof content === "string") return 0;
  return content.filter((c) => c.type === "tool_use").length;
}

/**
 * Encode a filesystem path to match Claude's project directory naming.
 * e.g. /Users/foo/Dev -> -Users-foo-Dev
 */
export function encodeProjectPath(projectPath: string): string {
  return projectPath.replace(/\//g, "-");
}

/**
 * Find all Claude project directories that could match the given project path.
 */
export function findClaudeProjectDirs(projectPath: string): string[] {
  const claudeDir = path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    ".claude",
    "projects",
  );

  if (!fs.existsSync(claudeDir)) return [];

  const encoded = encodeProjectPath(projectPath);
  const dirs = fs.readdirSync(claudeDir);

  // Match exact or parent paths
  return dirs
    .filter((d) => encoded.startsWith(d) || d.startsWith(encoded))
    .map((d) => path.join(claudeDir, d));
}

/**
 * Get sessions from the index that overlap with the given time window.
 */
export function getSessionsInWindow(
  projectDirs: string[],
  since: Date,
  until: Date,
): Array<{ sessionId: string; fullPath: string }> {
  const sessions: Array<{ sessionId: string; fullPath: string }> = [];

  for (const dir of projectDirs) {
    const indexPath = path.join(dir, "sessions-index.json");

    if (fs.existsSync(indexPath)) {
      // Use the index for fast lookup
      try {
        const index: SessionIndexFile = JSON.parse(
          fs.readFileSync(indexPath, "utf-8"),
        );

        for (const entry of index.entries) {
          const created = new Date(entry.created);
          const modified = new Date(entry.modified);

          if (modified >= since && created <= until) {
            const jsonlPath =
              entry.fullPath || path.join(dir, `${entry.sessionId}.jsonl`);
            if (fs.existsSync(jsonlPath)) {
              sessions.push({ sessionId: entry.sessionId, fullPath: jsonlPath });
            }
          }
        }
      } catch {
        // Skip malformed index files
      }
    } else {
      // Fallback: scan .jsonl files directly when index is missing
      try {
        const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.mtimeMs >= since.getTime() && stat.birthtimeMs <= until.getTime()) {
            const sessionId = file.replace(".jsonl", "");
            sessions.push({ sessionId, fullPath });
          }
        }
      } catch {
        // Skip unreadable directories
      }
    }
  }

  return sessions;
}

/**
 * Parse a single JSONL session file and count interactions within a time window.
 */
export function parseSessionFile(
  filePath: string,
  since: Date,
  until: Date,
): SessionStats | null {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());

  let aiResponses = 0;
  let toolCalls = 0;
  let startTime: string | undefined;
  let endTime: string | undefined;
  let sessionId = "";
  const prompts: PromptDetail[] = [];

  for (const line of lines) {
    let msg: JSONLMessage;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }

    // Skip non-message entries (file-history-snapshot, summary, etc.)
    if (!msg.type || msg.type === "file-history-snapshot" || msg.type === "summary") {
      continue;
    }

    if (msg.sessionId) sessionId = msg.sessionId;

    // Filter by time window
    if (msg.timestamp) {
      const ts = new Date(msg.timestamp);
      if (ts < since || ts > until) continue;

      if (!startTime || ts.toISOString() < startTime) startTime = ts.toISOString();
      if (!endTime || ts.toISOString() > endTime) endTime = ts.toISOString();
    }

    // Count user prompts: type=user, role=user, not meta, not commands
    if (msg.type === "user" && msg.message?.role === "user") {
      if (msg.isMeta) continue;
      if (msg.isSidechain) continue;
      if (msg.message.content && isCommand(msg.message.content)) continue;
      if (msg.message.content && isSystemGenerated(msg.message.content)) continue;
      const raw = typeof msg.message.content === "string"
        ? msg.message.content
        : msg.message.content?.map((c) => c.text || "").join("") ?? "";
      const trimmed = stripInterruptPrefix(raw.trim());
      if (trimmed.length > 0) {
        prompts.push({
          text: trimmed.slice(0, 500),
          timestamp: msg.timestamp || "",
          sessionId,
        });
      }
    }

    // Count AI responses
    if (msg.message?.role === "assistant") {
      aiResponses++;
      if (msg.message.content) {
        toolCalls += countToolUses(msg.message.content);
      }
    }
  }

  const userPrompts = prompts.length;
  if (userPrompts === 0 && aiResponses === 0) return null;

  return {
    sessionId,
    userPrompts,
    aiResponses,
    toolCalls,
    totalInteractions: userPrompts + aiResponses,
    startTime,
    endTime,
    prompts,
  };
}

/**
 * Main entry point: parse all Claude sessions for a project within a time window.
 * Returns aggregated stats and individual session details.
 */
export function parseClaudeSessions(
  projectPath: string,
  since: Date,
  until: Date,
): { aggregate: SessionStats; sessions: SessionStats[] } {
  const projectDirs = findClaudeProjectDirs(projectPath);
  const sessionFiles = getSessionsInWindow(projectDirs, since, until);

  const sessions: SessionStats[] = [];
  let totalUserPrompts = 0;
  let totalAiResponses = 0;
  let totalToolCalls = 0;

  for (const { fullPath } of sessionFiles) {
    const stats = parseSessionFile(fullPath, since, until);
    if (stats) {
      sessions.push(stats);
      totalUserPrompts += stats.userPrompts;
      totalAiResponses += stats.aiResponses;
      totalToolCalls += stats.toolCalls;
    }
  }

  const allPrompts = sessions
    .flatMap((s) => s.prompts ?? [])
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    aggregate: {
      sessionId: "aggregate",
      userPrompts: totalUserPrompts,
      aiResponses: totalAiResponses,
      toolCalls: totalToolCalls,
      totalInteractions: totalUserPrompts + totalAiResponses,
      prompts: allPrompts,
    },
    sessions,
  };
}
