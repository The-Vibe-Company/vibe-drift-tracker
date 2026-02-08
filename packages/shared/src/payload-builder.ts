import { execSync } from "child_process";
import { CommitPayload, FileChangePayload } from "./types";
import { parseClaudeSessions } from "./claude-parser";

function exec(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, encoding: "utf-8" }).trim();
}

function parseFileChanges(diffStat: string): FileChangePayload[] {
  const changes: FileChangePayload[] = [];
  for (const line of diffStat.split("\n")) {
    if (!line.trim()) continue;
    // Format: "added\tdeleted\tfilepath" or for binary: "-\t-\tfilepath"
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const added = parseInt(parts[0], 10) || 0;
    const deleted = parseInt(parts[1], 10) || 0;
    const filePath = parts.slice(2).join("\t");
    changes.push({ filePath, linesAdded: added, linesDeleted: deleted, status: "modified" });
  }
  return changes;
}

function detectFileStatus(
  fileChanges: FileChangePayload[],
  statusOutput: string,
): FileChangePayload[] {
  const statusMap = new Map<string, FileChangePayload["status"]>();
  for (const line of statusOutput.split("\n")) {
    if (!line.trim()) continue;
    const code = line.charAt(0);
    const file = line.substring(2).trim();
    switch (code) {
      case "A":
        statusMap.set(file, "added");
        break;
      case "D":
        statusMap.set(file, "deleted");
        break;
      case "R":
        statusMap.set(file, "renamed");
        break;
      case "C":
        statusMap.set(file, "copied");
        break;
      default:
        statusMap.set(file, "modified");
    }
  }

  return fileChanges.map((fc) => ({
    ...fc,
    status: statusMap.get(fc.filePath) ?? fc.status,
  }));
}

export async function buildCommitPayload(
  repoPath: string,
  commitHash: string,
  source: CommitPayload["source"],
): Promise<CommitPayload> {
  // Get commit metadata
  const message = exec(`git log -1 --format=%s ${commitHash}`, repoPath);
  const author = exec(`git log -1 --format=%an ${commitHash}`, repoPath);
  const committedAt = exec(`git log -1 --format=%aI ${commitHash}`, repoPath);
  const branch = exec("git rev-parse --abbrev-ref HEAD", repoPath);

  // Project name from directory
  const projectName = repoPath.split("/").pop() || "unknown";

  // Remote URL (optional)
  let remoteUrl: string | undefined;
  try {
    remoteUrl = exec("git remote get-url origin", repoPath) || undefined;
  } catch {
    remoteUrl = undefined;
  }

  // Diff stats for this commit
  const numstat = exec(
    `git diff --numstat ${commitHash}~1 ${commitHash} 2>/dev/null || git diff --numstat --root ${commitHash}`,
    repoPath,
  );
  let fileChanges = parseFileChanges(numstat);

  // Detect file statuses (A/D/M/R/C)
  try {
    const nameStatus = exec(
      `git diff --name-status ${commitHash}~1 ${commitHash} 2>/dev/null || git diff --name-status --root ${commitHash}`,
      repoPath,
    );
    fileChanges = detectFileStatus(fileChanges, nameStatus);
  } catch {
    // Keep default "modified" status
  }

  const linesAdded = fileChanges.reduce((s, f) => s + f.linesAdded, 0);
  const linesDeleted = fileChanges.reduce((s, f) => s + f.linesDeleted, 0);

  // Time window: previous commit timestamp -> this commit timestamp
  let sinceDate: Date;
  try {
    const prevTimestamp = exec(
      `git log -1 --format=%aI ${commitHash}~1`,
      repoPath,
    );
    sinceDate = new Date(prevTimestamp);
  } catch {
    // First commit — use 24h before
    sinceDate = new Date(new Date(committedAt).getTime() - 24 * 60 * 60 * 1000);
  }
  const untilDate = new Date(committedAt);

  // Parse Claude sessions in this time window
  const { aggregate, sessions } = parseClaudeSessions(
    repoPath,
    sinceDate,
    untilDate,
  );

  return {
    commitHash,
    message,
    author,
    branch,
    committedAt,
    projectName,
    remoteUrl,
    userPrompts: aggregate.userPrompts,
    aiResponses: aggregate.aiResponses,
    totalInteractions: aggregate.totalInteractions,
    toolCalls: aggregate.toolCalls,
    filesChanged: fileChanges.length,
    linesAdded,
    linesDeleted,
    source,
    sessionIds: sessions.map((s) => s.sessionId),
    fileChanges,
    prompts: aggregate.prompts ?? [],
  };
}
