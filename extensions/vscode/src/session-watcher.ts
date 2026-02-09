import * as fs from "fs";
import { execSync } from "child_process";
import {
  findClaudeProjectDirs,
  getSessionsInWindow,
  parseSessionFile,
  computeVibeDriftScore,
  getVibeDriftLevel,
  type VibeDriftLevel,
} from "@vibedrift/shared";

type ScoreCallback = (score: number, level: VibeDriftLevel, promptCount: number) => void;

interface FileCache {
  size: number;
  userPrompts: number;
}

export class SessionWatcher {
  private repoPath: string;
  private onScoreUpdate: ScoreCallback;
  private sinceTimestamp: Date;
  private scoreInterval: ReturnType<typeof setInterval> | undefined;
  private filesInterval: ReturnType<typeof setInterval> | undefined;
  private fileWatchers: Map<string, fs.FSWatcher> = new Map();
  private fileCache: Map<string, FileCache> = new Map();
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(repoPath: string, onScoreUpdate: ScoreCallback) {
    this.repoPath = repoPath;
    this.onScoreUpdate = onScoreUpdate;
    this.sinceTimestamp = this.getLastCommitTimestamp();
  }

  start(): void {
    this.refreshWatchedFiles();
    this.computeCurrentScore();

    // Poll score every 3 seconds (also refreshes git diff)
    this.scoreInterval = setInterval(() => this.computeCurrentScore(), 3000);

    // Discover new session files every 30 seconds
    this.filesInterval = setInterval(() => this.refreshWatchedFiles(), 30000);
  }

  resetSession(): void {
    this.sinceTimestamp = new Date();
    this.fileCache.clear();
    this.computeCurrentScore();
  }

  dispose(): void {
    if (this.scoreInterval) clearInterval(this.scoreInterval);
    if (this.filesInterval) clearInterval(this.filesInterval);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    for (const watcher of this.fileWatchers.values()) {
      watcher.close();
    }
    this.fileWatchers.clear();
  }

  private computeCurrentScore(): void {
    try {
      const now = new Date();
      const projectDirs = findClaudeProjectDirs(this.repoPath);
      const sessions = getSessionsInWindow(projectDirs, this.sinceTimestamp, now);

      let totalPrompts = 0;

      for (const { fullPath } of sessions) {
        const prompts = this.getPromptsForFile(fullPath, now);
        totalPrompts += prompts;
      }

      const { linesAdded, linesDeleted } = this.getUncommittedChanges();
      const score = computeVibeDriftScore(totalPrompts, linesAdded, linesDeleted);
      const level = getVibeDriftLevel(score);

      this.onScoreUpdate(score, level, totalPrompts);
    } catch {
      // Silently ignore errors during polling
    }
  }

  private getPromptsForFile(fullPath: string, now: Date): number {
    try {
      const stat = fs.statSync(fullPath);
      const cached = this.fileCache.get(fullPath);

      // If file size hasn't changed, reuse cached prompt count
      if (cached && cached.size === stat.size) {
        return cached.userPrompts;
      }

      const result = parseSessionFile(fullPath, this.sinceTimestamp, now);
      const userPrompts = result?.userPrompts ?? 0;

      this.fileCache.set(fullPath, { size: stat.size, userPrompts });
      return userPrompts;
    } catch {
      return 0;
    }
  }

  private getUncommittedChanges(): { linesAdded: number; linesDeleted: number } {
    try {
      const output = execSync("git diff HEAD --numstat", {
        cwd: this.repoPath,
        encoding: "utf-8",
        timeout: 5000,
      });

      let linesAdded = 0;
      let linesDeleted = 0;

      for (const line of output.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parts = trimmed.split("\t");
        if (parts.length < 3) continue;

        // Binary files show "-" for added/deleted
        const added = parseInt(parts[0], 10);
        const deleted = parseInt(parts[1], 10);
        if (!isNaN(added)) linesAdded += added;
        if (!isNaN(deleted)) linesDeleted += deleted;
      }

      return { linesAdded, linesDeleted };
    } catch {
      return { linesAdded: 0, linesDeleted: 0 };
    }
  }

  private refreshWatchedFiles(): void {
    try {
      const now = new Date();
      const projectDirs = findClaudeProjectDirs(this.repoPath);
      const sessions = getSessionsInWindow(projectDirs, this.sinceTimestamp, now);

      const currentPaths = new Set(sessions.map((s) => s.fullPath));

      // Remove watchers for files no longer relevant
      for (const [filePath, watcher] of this.fileWatchers) {
        if (!currentPaths.has(filePath)) {
          watcher.close();
          this.fileWatchers.delete(filePath);
        }
      }

      // Add watchers for new files
      for (const filePath of currentPaths) {
        if (this.fileWatchers.has(filePath)) continue;

        try {
          const watcher = fs.watch(filePath, () => {
            // Debounce: wait 500ms after last change before recomputing
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.computeCurrentScore(), 500);
          });
          this.fileWatchers.set(filePath, watcher);
        } catch {
          // Skip files that can't be watched
        }
      }
    } catch {
      // Silently ignore errors during refresh
    }
  }

  private getLastCommitTimestamp(): Date {
    try {
      const output = execSync("git log -1 --format=%aI HEAD", {
        cwd: this.repoPath,
        encoding: "utf-8",
        timeout: 5000,
      });
      const date = new Date(output.trim());
      return isNaN(date.getTime()) ? new Date(0) : date;
    } catch {
      return new Date(0);
    }
  }
}
