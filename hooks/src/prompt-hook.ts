import { computeCurrentDrift } from "./shared-runtime";

interface UserPromptSubmitInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: string;
  prompt: string;
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
    const input: UserPromptSubmitInput = JSON.parse(raw);
    const projectPath = input.cwd;

    const drift = computeCurrentDrift(projectPath);

    if (drift.userPrompts === 0) {
      process.exit(0);
      return;
    }

    let contextMessage = `[VibeDrift] Score: ${drift.score.toFixed(1)} (${drift.level}) | ${drift.userPrompts} prompt${drift.userPrompts !== 1 ? "s" : ""} since last commit, +${drift.linesAdded}/-${drift.linesDeleted} lines`;

    if (drift.level === "high") {
      contextMessage += " -- Consider committing your current progress before continuing.";
    } else if (drift.level === "vibe-drift") {
      contextMessage += " -- WARNING: Significant vibe drift detected. You may be feature-creeping or losing focus. Strongly consider committing or reviewing your approach.";
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: contextMessage,
      },
    };

    process.stdout.write(JSON.stringify(output));
  } catch {
    process.exit(0);
  }
}

main();
