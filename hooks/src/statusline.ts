import { computeCurrentDrift } from "./shared-runtime";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function ansiColor(hex: string, text: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1b[38;2;${r};${g};${b}m${text}${RESET}`;
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

async function main() {
  try {
    const raw = await readStdin();
    const input = JSON.parse(raw);
    const projectPath = input.workspace?.current_dir || input.cwd;

    const drift = computeCurrentDrift(projectPath);

    const scoreText = ansiColor(drift.color, `${drift.score.toFixed(1)} (${drift.level})`);
    const promptsText = `${drift.userPrompts} prompt${drift.userPrompts !== 1 ? "s" : ""}`;
    const linesText = `${DIM}+${drift.linesAdded}/-${drift.linesDeleted}${RESET}`;

    process.stdout.write(`${BOLD}VibeDrift${RESET} ${scoreText} | ${promptsText} ${linesText}`);
  } catch {
    process.stdout.write("VibeDrift: --");
  }
}

main();
