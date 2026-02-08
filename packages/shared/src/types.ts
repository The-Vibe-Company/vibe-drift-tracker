export interface PromptDetail {
  text: string;       // content of the prompt (truncated to 500 chars)
  timestamp: string;  // ISO 8601
  sessionId: string;
  response?: string;  // AI response text (truncated to 500 chars)
}

export interface FileChangePayload {
  filePath: string;
  linesAdded: number;
  linesDeleted: number;
  status: "added" | "modified" | "deleted" | "renamed" | "copied";
}

export interface CommitPayload {
  commitHash: string;
  message: string;
  author: string;
  branch: string;
  committedAt: string; // ISO 8601
  projectName: string;
  remoteUrl?: string;
  userPrompts: number;
  aiResponses: number;
  totalInteractions: number;
  toolCalls: number;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  source: "vscode" | "hook" | "manual";
  sessionIds: string[];
  fileChanges?: FileChangePayload[];
  prompts?: PromptDetail[];
}

export interface SessionStats {
  sessionId: string;
  userPrompts: number;
  aiResponses: number;
  toolCalls: number;
  totalInteractions: number;
  startTime?: string;
  endTime?: string;
  prompts?: PromptDetail[];
}

export interface SessionIndexEntry {
  sessionId: string;
  path: string;
  lastModified: number;
}

export function computeVibeDriftScore(
  userPrompts: number,
  linesAdded: number,
  linesDeleted: number,
): number {
  const totalLines = linesAdded + linesDeleted;
  return userPrompts / Math.max(1, totalLines / 100);
}

export type VibeDriftLevel = "low" | "moderate" | "high" | "vibe-drift";

export function getVibeDriftLevel(score: number): VibeDriftLevel {
  if (score <= 1) return "low";
  if (score <= 3) return "moderate";
  if (score <= 6) return "high";
  return "vibe-drift";
}

export function getVibeDriftColor(level: VibeDriftLevel): string {
  switch (level) {
    case "low":
      return "#22c55e"; // green
    case "moderate":
      return "#eab308"; // yellow
    case "high":
      return "#f97316"; // orange
    case "vibe-drift":
      return "#ef4444"; // red
  }
}
