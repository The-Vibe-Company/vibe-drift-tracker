import * as vscode from "vscode";
import { buildCommitPayload } from "vibedrift-shared";
import { GitWatcher } from "./git-watcher";
import { SessionWatcher } from "./session-watcher";
import { sendCommitPayload } from "./api-client";
import { createStatusBar, updateStatusBar, disposeStatusBar } from "./status-bar";
import { VibeDriftSidebarProvider } from "./sidebar-view";
import { getApiUrl } from "./config";

let gitWatcher: GitWatcher | undefined;
let sessionWatcher: SessionWatcher | undefined;
let outputChannel: vscode.OutputChannel;
let sidebarProvider: VibeDriftSidebarProvider | undefined;

function log(message: string) {
  const time = new Date().toLocaleTimeString();
  outputChannel.appendLine(`[${time}] ${message}`);
}

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("VibeDrift");
  context.subscriptions.push(outputChannel);

  log("Extension activating...");

  sidebarProvider = new VibeDriftSidebarProvider(context, log);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      VibeDriftSidebarProvider.viewType,
      sidebarProvider,
    ),
  );

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: async (uri: vscode.Uri) => {
        if (uri.path !== "/auth-callback") {
          return;
        }
        await sidebarProvider?.handleAuthCallback(uri);
      },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vibedrift.openSidebar", async () => {
      await vscode.commands.executeCommand(
        "workbench.view.extension.vibedrift",
      );
      await vscode.commands.executeCommand(
        "vibedrift.sidebarView.focus",
      );
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration("vibedrift.apiKey") || event.affectsConfiguration("vibedrift.apiUrl")) {
        await sidebarProvider?.onConfigurationChanged();
      }
    }),
  );

  const config = vscode.workspace.getConfiguration("vibedrift");
  const apiUrl = getApiUrl();
  const apiKey = config.get<string>("apiKey", "");
  log(`API URL: ${apiUrl}`);
  log(`API Key: ${apiKey ? "configured" : "NOT SET — go to /dashboard/settings to generate one"}`);

  const statusBar = createStatusBar();
  context.subscriptions.push(statusBar);

  if (!config.get<boolean>("enabled", true)) {
    log("Tracking disabled in settings (sidebar remains available)");
    return;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    log("No workspace folder found (sidebar is available)");
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
      const url = getApiUrl();
      const key = currentConfig.get<string>("apiKey", "");

      const payload = await buildCommitPayload(_repoPath, commitHash, "vscode");
      if (!payload) {
        log("Commit skipped — author differs from current git user");
        return;
      }
      log(`Prompts extracted: ${payload.prompts?.length ?? 0}`);
      if (payload.prompts && payload.prompts.length > 0) {
        log(`First prompt: "${payload.prompts[0].text.slice(0, 80)}..."`);
      }
      log(`Sending payload for project "${payload.projectName}"...`);

      const result = await sendCommitPayload(url, payload, key || undefined);
      log(`Done — drift: ${result.vibeDriftLevel} (${result.vibeDriftScore.toFixed(1)})`);
      await sidebarProvider?.refresh();

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
