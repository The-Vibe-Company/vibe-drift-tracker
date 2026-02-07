import * as vscode from "vscode";
import { execSync } from "child_process";

type CommitCallback = (repoPath: string, commitHash: string) => void;

export class GitWatcher implements vscode.Disposable {
  private watcher: vscode.FileSystemWatcher | undefined;
  private lastHead: string | undefined;
  private interval: ReturnType<typeof setInterval> | undefined;

  constructor(
    private repoPath: string,
    private onNewCommit: CommitCallback,
  ) {}

  start(): void {
    // Watch .git/HEAD and refs for changes
    const gitHeadPattern = new vscode.RelativePattern(
      this.repoPath,
      ".git/{HEAD,refs/heads/**}",
    );
    this.watcher = vscode.workspace.createFileSystemWatcher(gitHeadPattern);

    this.lastHead = this.getCurrentHead();

    const checkForNewCommit = () => {
      const currentHead = this.getCurrentHead();
      if (currentHead && currentHead !== this.lastHead) {
        this.lastHead = currentHead;
        this.onNewCommit(this.repoPath, currentHead);
      }
    };

    this.watcher.onDidChange(checkForNewCommit);
    this.watcher.onDidCreate(checkForNewCommit);

    // Also poll every 5 seconds as a fallback
    this.interval = setInterval(checkForNewCommit, 5000);
  }

  private getCurrentHead(): string | undefined {
    try {
      return execSync("git rev-parse HEAD", {
        cwd: this.repoPath,
        encoding: "utf-8",
      }).trim();
    } catch {
      return undefined;
    }
  }

  dispose(): void {
    this.watcher?.dispose();
    if (this.interval) clearInterval(this.interval);
  }
}
