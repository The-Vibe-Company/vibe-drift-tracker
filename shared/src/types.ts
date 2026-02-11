export interface PromptDetail {
  text: string;       // content of the prompt (truncated to 500 chars)
  timestamp: string;  // ISO 8601
  sessionId: string;
  codeGenerated?: boolean; // true if assistant response used Write/Edit/NotebookEdit
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
  codePrompts?: number;
  aiResponses: number;
  totalInteractions: number;
  toolCalls: number;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  source: "vscode" | "hook" | "manual" | "live";
  sessionIds: string[];
  fileChanges?: FileChangePayload[];
  prompts?: PromptDetail[];
}

export interface SessionStats {
  sessionId: string;
  userPrompts: number;
  codePrompts: number;
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
  linesAdded: number = 0,
  linesDeleted: number = 0,
): number {
  const P = userPrompts;
  const L = linesAdded + linesDeleted;
  const linesPerPrompt = L / Math.max(1, P);

  // Efficiency factor: lpp >= 50 → 0.7 (productive), lpp = 20 → 1.0, lpp <= 5 → 1.5 (spinning)
  let factor = Math.min(1.5, Math.max(0.7, 1.5 - linesPerPrompt / 40));

  // 1 prompt should never be penalised
  if (P <= 1) factor = Math.min(factor, 1.0);

  return P * factor;
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
