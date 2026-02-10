import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { execSync } from "child_process";
import {
  findClaudeProjectDirs,
  getSessionsInWindow,
  parseSessionFile,
  computeVibeDriftScore,
  getVibeDriftLevel,
  getVibeDriftColor,
  type VibeDriftLevel,
} from "vibedrift-shared";

export interface VibeDriftSnapshot {
  score: number;
  level: VibeDriftLevel;
  color: string;
  userPrompts: number;
  linesAdded: number;
  linesDeleted: number;
  cachedAt: number;
}

interface CacheFile {
  snapshot: VibeDriftSnapshot;
  projectPath: string;
  lastCommitHash: string;
}

const CACHE_MAX_AGE_MS = 3000;

function getCachePath(projectPath: string): string {
  const hash = crypto.createHash("md5").update(projectPath).digest("hex").slice(0, 12);
  return path.join("/tmp", `vibedrift-cache-${hash}.json`);
}

function getLastCommitInfo(cwd: string): { hash: string; timestamp: Date } {
  try {
    const raw = execSync("git log -1 --format='%H %aI' HEAD", { cwd, encoding: "utf-8", timeout: 5000 }).trim();
    const spaceIdx = raw.indexOf(" ");
    const hash = raw.slice(0, spaceIdx);
    const ts = raw.slice(spaceIdx + 1);
    const date = new Date(ts);
    return { hash, timestamp: isNaN(date.getTime()) ? new Date(0) : date };
  } catch {
    return { hash: "", timestamp: new Date(0) };
  }
}

function getUncommittedDiffStats(cwd: string): { linesAdded: number; linesDeleted: number } {
  try {
    const output = execSync("git diff HEAD --numstat", { cwd, encoding: "utf-8", timeout: 5000 });
    let linesAdded = 0;
    let linesDeleted = 0;
    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split("\t");
      if (parts.length < 3) continue;
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

function readCache(cachePath: string, projectPath: string, currentCommitHash: string): VibeDriftSnapshot | null {
  try {
    if (!fs.existsSync(cachePath)) return null;
    const raw = fs.readFileSync(cachePath, "utf-8");
    const cache: CacheFile = JSON.parse(raw);
    if (cache.projectPath !== projectPath) return null;
    if (cache.lastCommitHash !== currentCommitHash) return null;
    if (Date.now() - cache.snapshot.cachedAt > CACHE_MAX_AGE_MS) return null;
    return cache.snapshot;
  } catch {
    return null;
  }
}

function writeCache(cachePath: string, snapshot: VibeDriftSnapshot, projectPath: string, commitHash: string): void {
  try {
    const cache: CacheFile = { snapshot, projectPath, lastCommitHash: commitHash };
    fs.writeFileSync(cachePath, JSON.stringify(cache));
  } catch {
    // Silently ignore cache write failures
  }
}

export function computeCurrentDrift(projectPath: string): VibeDriftSnapshot {
  const cachePath = getCachePath(projectPath);
  const { hash: commitHash, timestamp: sinceDate } = getLastCommitInfo(projectPath);

  const cached = readCache(cachePath, projectPath, commitHash);
  if (cached) return cached;

  const now = new Date();
  const projectDirs = findClaudeProjectDirs(projectPath);
  const sessionFiles = getSessionsInWindow(projectDirs, sinceDate, now);

  let totalPrompts = 0;
  for (const { fullPath } of sessionFiles) {
    const stats = parseSessionFile(fullPath, sinceDate, now);
    if (stats) totalPrompts += stats.userPrompts;
  }

  const { linesAdded, linesDeleted } = getUncommittedDiffStats(projectPath);
  const score = computeVibeDriftScore(totalPrompts, linesAdded, linesDeleted);
  const level = getVibeDriftLevel(score);
  const color = getVibeDriftColor(level);

  const snapshot: VibeDriftSnapshot = {
    score,
    level,
    color,
    userPrompts: totalPrompts,
    linesAdded,
    linesDeleted,
    cachedAt: Date.now(),
  };

  writeCache(cachePath, snapshot, projectPath, commitHash);
  return snapshot;
}
