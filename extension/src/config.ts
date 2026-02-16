import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

function hasExplicitApiUrl(): string | undefined {
  const config = vscode.workspace.getConfiguration("vibedrift");
  const inspected = config.inspect<string>("apiUrl");

  const candidates = [
    inspected?.workspaceFolderValue,
    inspected?.workspaceValue,
    inspected?.globalValue,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function isLocalVibeDriftWorkspace(): boolean {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return false;

  for (const folder of folders) {
    const root = folder.uri.fsPath;
    const appPkg = path.join(root, "app", "package.json");
    const extPkg = path.join(root, "extension", "package.json");

    if (!fs.existsSync(appPkg) || !fs.existsSync(extPkg)) continue;

    try {
      const app = JSON.parse(fs.readFileSync(appPkg, "utf8")) as { name?: string };
      const ext = JSON.parse(fs.readFileSync(extPkg, "utf8")) as { name?: string };
      if (app.name === "vibedrift-app" && ext.name === "vibedrift-vscode") {
        return true;
      }
    } catch {
      // Ignore malformed package files.
    }
  }

  return false;
}

export function getApiUrl(): string {
  const explicit = hasExplicitApiUrl();
  if (explicit) return explicit;

  if (isLocalVibeDriftWorkspace()) {
    return "http://localhost:3000";
  }

  return "https://www.vibedrift.dev";
}
