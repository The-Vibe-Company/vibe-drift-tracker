import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const MARKER = "# vibedrift-hook";

function findGitDir(): string {
  try {
    const gitDir = execSync("git rev-parse --git-dir", { encoding: "utf-8" }).trim();
    return path.resolve(gitDir);
  } catch {
    throw new Error("Not in a git repository. Run this from inside a git repo.");
  }
}

function resolveHookScript(): string {
  // Resolve the bundled post-commit.js from vibedrift-hooks
  const hookEntry = require.resolve("vibedrift-hooks/dist/post-commit.js");
  return hookEntry;
}

function buildHookContent(hookScriptPath: string, apiUrl?: string, apiKey?: string): string {
  const urlLine = apiUrl
    ? `export VIBEDRIFT_API_URL="${apiUrl}"`
    : `export VIBEDRIFT_API_URL="\${VIBEDRIFT_API_URL:-http://localhost:3000}"`;

  const keyLine = apiKey
    ? `export VIBEDRIFT_API_KEY="${apiKey}"`
    : "";

  return `#!/bin/sh
${MARKER}
${urlLine}
${keyLine}
node "${hookScriptPath}" || true
`.replace(/\n\n\n/g, "\n\n");
}

function writeProjectConfig(apiUrl?: string, apiKey?: string) {
  const configPath = path.join(process.cwd(), ".vibedrift.json");
  const config: Record<string, string> = {};
  if (apiUrl) config.apiUrl = apiUrl;
  if (apiKey) config.apiKey = apiKey;
  if (Object.keys(config).length > 0) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    console.log(`vibedrift: config saved to ${configPath}`);
  }
}

export async function init(apiUrl?: string, apiKey?: string) {
  const gitDir = findGitDir();
  const hooksDir = path.join(gitDir, "hooks");
  const hookPath = path.join(hooksDir, "post-commit");

  const hookScriptPath = resolveHookScript();

  // Ensure hooks directory exists
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // Save project config for prompt hook / statusline
  writeProjectConfig(apiUrl, apiKey);

  let content = buildHookContent(hookScriptPath, apiUrl, apiKey);

  // If an existing hook exists and it's not ours, chain it
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf-8");
    if (existing.includes(MARKER)) {
      // Already installed — overwrite with updated config
      console.log("vibedrift: updating existing hook");
    } else {
      // Chain the existing hook
      console.log("vibedrift: chaining with existing post-commit hook");
      content += `\n# --- original hook ---\n${existing}\n`;
    }
  }

  fs.writeFileSync(hookPath, content, { mode: 0o755 });
  console.log(`vibedrift: post-commit hook installed at ${hookPath}`);
  if (apiUrl) {
    console.log(`vibedrift: API URL set to ${apiUrl}`);
  }
  if (apiKey) {
    console.log("vibedrift: API key configured");
  }
}

export async function installClaudeCodeHooks(options: { global?: boolean } = {}) {
  const promptHookPath = require.resolve("vibedrift-hooks/dist/prompt-hook.js");
  const postToolUsePath = require.resolve("vibedrift-hooks/dist/post-tool-use.js");
  const statuslinePath = require.resolve("vibedrift-hooks/dist/statusline.js");

  let settingsPath: string;
  if (options.global) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || "";
    settingsPath = path.join(homeDir, ".claude", "settings.json");
  } else {
    settingsPath = path.join(process.cwd(), ".claude", "settings.json");
  }

  let settings: Record<string, unknown> = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
      // Start fresh if malformed
    }
  }

  const settingsDir = path.dirname(settingsPath);
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }

  // Add UserPromptSubmit hook
  if (!settings.hooks) settings.hooks = {};
  const hooks = settings.hooks as Record<string, unknown[]>;

  const promptHookCommand = `node "${promptHookPath}"`;
  const promptHookEntry = {
    hooks: [{ type: "command", command: promptHookCommand }],
  };

  if (!hooks.UserPromptSubmit) {
    hooks.UserPromptSubmit = [promptHookEntry];
  } else {
    const existing = hooks.UserPromptSubmit as Array<{ hooks?: Array<{ command?: string }> }>;
    const vibedriftIndex = existing.findIndex((group) =>
      group.hooks?.some((h) => h.command?.includes("vibedrift") || h.command?.includes("prompt-hook")),
    );
    if (vibedriftIndex >= 0) {
      existing[vibedriftIndex] = promptHookEntry;
      console.log("vibedrift: updating existing UserPromptSubmit hook");
    } else {
      existing.push(promptHookEntry);
    }
  }

  // Add PostToolUse hook (pre-warm cache after git commit)
  const postToolUseCommand = `node "${postToolUsePath}"`;
  const postToolUseEntry = {
    matcher: "Bash",
    hooks: [{ type: "command", command: postToolUseCommand }],
  };

  if (!hooks.PostToolUse) {
    hooks.PostToolUse = [postToolUseEntry];
  } else {
    const existingPtu = hooks.PostToolUse as Array<{ hooks?: Array<{ command?: string }> }>;
    const vibedriftPtuIndex = existingPtu.findIndex((group) =>
      group.hooks?.some((h) => h.command?.includes("vibedrift") || h.command?.includes("post-tool-use")),
    );
    if (vibedriftPtuIndex >= 0) {
      existingPtu[vibedriftPtuIndex] = postToolUseEntry;
      console.log("vibedrift: updating existing PostToolUse hook");
    } else {
      existingPtu.push(postToolUseEntry);
    }
  }

  // Add statusLine
  settings.statusLine = {
    type: "command",
    command: `node "${statuslinePath}"`,
  };

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`vibedrift: Claude Code hooks installed at ${settingsPath}`);
  console.log(`vibedrift: UserPromptSubmit hook -> ${promptHookPath}`);
  console.log(`vibedrift: PostToolUse hook -> ${postToolUsePath}`);
  console.log(`vibedrift: statusLine -> ${statuslinePath}`);
}

export async function uninstallClaudeCodeHooks(options: { global?: boolean } = {}) {
  let settingsPath: string;
  if (options.global) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || "";
    settingsPath = path.join(homeDir, ".claude", "settings.json");
  } else {
    settingsPath = path.join(process.cwd(), ".claude", "settings.json");
  }

  if (!fs.existsSync(settingsPath)) {
    console.log("vibedrift: no Claude Code settings found");
    return;
  }

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  } catch {
    console.log("vibedrift: could not parse settings file");
    return;
  }

  const hooks = settings.hooks as Record<string, unknown[]> | undefined;
  if (hooks?.UserPromptSubmit) {
    hooks.UserPromptSubmit = (hooks.UserPromptSubmit as Array<{ hooks?: Array<{ command?: string }> }>).filter(
      (group) => !group.hooks?.some((h) => h.command?.includes("vibedrift") || h.command?.includes("prompt-hook")),
    );
    if (hooks.UserPromptSubmit.length === 0) {
      delete hooks.UserPromptSubmit;
    }
  }

  if (hooks?.PostToolUse) {
    hooks.PostToolUse = (hooks.PostToolUse as Array<{ hooks?: Array<{ command?: string }> }>).filter(
      (group) => !group.hooks?.some((h) => h.command?.includes("vibedrift") || h.command?.includes("post-tool-use")),
    );
    if (hooks.PostToolUse.length === 0) {
      delete hooks.PostToolUse;
    }
  }

  if (hooks && Object.keys(hooks).length === 0) {
    delete settings.hooks;
  }

  const statusLine = settings.statusLine as { command?: string } | undefined;
  if (statusLine?.command?.includes("vibedrift") || statusLine?.command?.includes("statusline")) {
    delete settings.statusLine;
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log("vibedrift: Claude Code hooks removed");
}

export async function uninstall() {
  const gitDir = findGitDir();
  const hookPath = path.join(gitDir, "hooks", "post-commit");

  if (!fs.existsSync(hookPath)) {
    console.log("vibedrift: no post-commit hook found");
    return;
  }

  const content = fs.readFileSync(hookPath, "utf-8");
  if (!content.includes(MARKER)) {
    console.log("vibedrift: post-commit hook is not a VibeDrift hook, skipping");
    return;
  }

  // Check if there was a chained original hook
  const originalMarker = "# --- original hook ---\n";
  const originalIndex = content.indexOf(originalMarker);
  if (originalIndex !== -1) {
    // Restore the original hook
    const original = content.slice(originalIndex + originalMarker.length);
    fs.writeFileSync(hookPath, original, { mode: 0o755 });
    console.log("vibedrift: hook removed, original hook restored");
  } else {
    fs.unlinkSync(hookPath);
    console.log("vibedrift: post-commit hook removed");
  }
}
