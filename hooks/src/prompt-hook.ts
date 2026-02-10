import {
  buildLivePayload,
  computeVibeDriftScore,
  getVibeDriftLevel,
} from "vibedrift-shared";

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

    const payload = await buildLivePayload(projectPath);
    const score = computeVibeDriftScore(payload.userPrompts, payload.linesAdded, payload.linesDeleted);
    const level = getVibeDriftLevel(score);

    if (payload.userPrompts === 0) {
      process.exit(0);
      return;
    }

    let contextMessage = `[VibeDrift] Score: ${score.toFixed(1)} (${level}) | ${payload.userPrompts} prompts since last commit, +${payload.linesAdded}/-${payload.linesDeleted} lines`;

    if (level === "high") {
      contextMessage += " -- Consider committing your current progress before continuing.";
    } else if (level === "vibe-drift") {
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
