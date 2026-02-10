import * as vscode from "vscode";
import { buildCommitPayload } from "@vibedrift/shared";
import { GitWatcher } from "./git-watcher";
import { SessionWatcher } from "./session-watcher";
import { sendCommitPayload } from "./api-client";
import { createStatusBar, updateStatusBar, disposeStatusBar } from "./status-bar";

let gitWatcher: GitWatcher | undefined;
let sessionWatcher: SessionWatcher | undefined;
let outputChannel: vscode.OutputChannel;

function log(message: string) {
  const time = new Date().toLocaleTimeString();
  outputChannel.appendLine(`[${time}] ${message}`);
}

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("VibeDrift");
  context.subscriptions.push(outputChannel);

  log("Extension activating...");

  const config = vscode.workspace.getConfiguration("vibedrift");
  if (!config.get<boolean>("enabled", true)) {
    log("Extension disabled in settings");
    return;
  }

  const apiUrl = config.get<string>("apiUrl", "http://localhost:3000");
  const apiKey = config.get<string>("apiKey", "");
  log(`API URL: ${apiUrl}`);
  log(`API Key: ${apiKey ? "configured" : "NOT SET — go to /dashboard/settings to generate one"}`);

  const statusBar = createStatusBar();
  context.subscriptions.push(statusBar);

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log("No workspace folder found");
    return;
  }

  const repoPath = workspaceFolders[0].uri.fsPath;
  log(`Watching repo: ${repoPath}`);

  // Real-time session watcher for live score updates
  sessionWatcher = new SessionWatcher(repoPath, (score, level, promptCount) => {
    updateStatusBar(score, level);
  });
  sessionWatcher.start();
  log("Session watcher started — real-time scoring active");

  gitWatcher = new GitWatcher(repoPath, async (_repoPath, commitHash) => {
    try {
      log(`New commit detected: ${commitHash.slice(0, 7)}`);
      sessionWatcher?.resetSession();

      const currentConfig = vscode.workspace.getConfiguration("vibedrift");
      const url = currentConfig.get<string>("apiUrl", "http://localhost:3000");
      const key = currentConfig.get<string>("apiKey", "");

      const payload = await buildCommitPayload(_repoPath, commitHash, "vscode");
      log(`Prompts extracted: ${payload.prompts?.length ?? 0}`);
      if (payload.prompts && payload.prompts.length > 0) {
        log(`First prompt: "${payload.prompts[0].text.slice(0, 80)}..."`);
      }
      log(`Sending payload for project "${payload.projectName}"...`);

      const result = await sendCommitPayload(url, payload, key || undefined);
      log(`Done — drift: ${result.vibeDriftLevel} (${result.vibeDriftScore.toFixed(1)})`);

      vscode.window.setStatusBarMessage(
        `VibeDrift: commit sent (${result.vibeDriftLevel})`,
        5000,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`ERROR: ${message}`);
    }
  });

  gitWatcher.start();
  log("Git watcher started — waiting for commits");

  context.subscriptions.push({
    dispose: () => {
      gitWatcher?.dispose();
      sessionWatcher?.dispose();
      disposeStatusBar();
    },
  });
}

export function deactivate() {
  gitWatcher?.dispose();
  sessionWatcher?.dispose();
  disposeStatusBar();
}
