import * as vscode from "vscode";
import { getVibeDriftColor, type VibeDriftLevel } from "@vibedrift/shared";

let statusBarItem: vscode.StatusBarItem | undefined;

export function createStatusBar(): vscode.StatusBarItem {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBarItem.text = "$(pulse) VibeDrift: --";
  statusBarItem.tooltip = "VibeDrift Tracker - waiting for commit";
  statusBarItem.show();
  return statusBarItem;
}

export function updateStatusBar(score: number, level: string): void {
  if (!statusBarItem) return;

  const color = getVibeDriftColor(level as VibeDriftLevel);
  statusBarItem.text = `$(pulse) VibeDrift: ${score.toFixed(1)} (${level})`;
  statusBarItem.tooltip = `Vibe Drift Score: ${score.toFixed(2)}\nLevel: ${level}`;
  statusBarItem.color = color;
}

export function disposeStatusBar(): void {
  statusBarItem?.dispose();
  statusBarItem = undefined;
}
