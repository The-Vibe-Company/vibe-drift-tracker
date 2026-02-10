import { computeCurrentDrift } from "./shared-runtime";

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
    const command = input.tool_input?.command;
    if (!command || !command.includes("git commit")) {
      process.exit(0);
    }
    computeCurrentDrift(input.cwd);
  } catch {
    process.exit(0);
  }
}

main();
