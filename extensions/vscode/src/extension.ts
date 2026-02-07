import * as vscode from "vscode";
import { buildCommitPayload } from "@vibedrift/shared";
import { GitWatcher } from "./git-watcher";
import { sendCommitPayload } from "./api-client";
import { createStatusBar, updateStatusBar, disposeStatusBar } from "./status-bar";

let gitWatcher: GitWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("vibedrift");
  if (!config.get<boolean>("enabled", true)) return;

  const statusBar = createStatusBar();
  context.subscriptions.push(statusBar);

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) return;

  const repoPath = workspaceFolders[0].uri.fsPath;

  gitWatcher = new GitWatcher(repoPath, async (_repoPath, commitHash) => {
    try {
      const apiUrl = config.get<string>("apiUrl", "http://localhost:3000");
      const apiKey = config.get<string>("apiKey", "");

      const payload = await buildCommitPayload(_repoPath, commitHash, "vscode");
      const result = await sendCommitPayload(apiUrl, payload, apiKey || undefined);

      updateStatusBar(result.vibeDriftScore, result.vibeDriftLevel);

      vscode.window.setStatusBarMessage(
        `VibeDrift: ${result.vibeDriftLevel} (${result.vibeDriftScore.toFixed(1)})`,
        5000,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("VibeDrift error:", message);
    }
  });

  gitWatcher.start();

  context.subscriptions.push({
    dispose: () => {
      gitWatcher?.dispose();
      disposeStatusBar();
    },
  });
}

export function deactivate() {
  gitWatcher?.dispose();
  disposeStatusBar();
}
