import { execSync } from "child_process";
import {
  buildCommitPayload,
  computeVibeDriftScore,
  getVibeDriftLevel,
  getVibeDriftColor,
} from "@vibedrift/shared";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function colorize(hex: string, text: string): string {
  // Convert hex to ANSI 256 color (approximate)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1b[38;2;${r};${g};${b}m${text}${RESET}`;
}

async function main() {
  const apiUrl = process.env.VIBEDRIFT_API_URL;
  if (!apiUrl) {
    // Silently skip if not configured
    return;
  }

  const cwd = process.cwd();
  let commitHash: string;
  try {
    commitHash = execSync("git rev-parse HEAD", { cwd, encoding: "utf-8" }).trim();
  } catch {
    console.error("vibedrift: not in a git repository");
    return;
  }

  try {
    const payload = await buildCommitPayload(cwd, commitHash, "hook");

    const score = computeVibeDriftScore(payload.userPrompts, payload.linesAdded, payload.linesDeleted);
    const level = getVibeDriftLevel(score);
    const color = getVibeDriftColor(level);

    // Send to API
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const apiKey = process.env.VIBEDRIFT_API_KEY;
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${apiUrl}/api/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`vibedrift: API error ${response.status}: ${body}`);
      return;
    }

    // Display in terminal
    console.log(
      `\n${BOLD}VibeDrift${RESET} ${colorize(color, `${score.toFixed(1)} (${level})`)}` +
        ` | ${payload.userPrompts} prompts, +${payload.linesAdded}/-${payload.linesDeleted} lines`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`vibedrift: ${message}`);
  }
}

main();
