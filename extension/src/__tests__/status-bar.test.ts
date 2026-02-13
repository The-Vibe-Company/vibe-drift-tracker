import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock vscode module (not available outside VS Code)
vi.mock("vscode", () => {
  const mockItem = {
    text: "",
    tooltip: "",
    color: undefined as string | undefined,
    show: vi.fn(),
    dispose: vi.fn(),
  };

  return {
    window: {
      createStatusBarItem: vi.fn(() => mockItem),
    },
    StatusBarAlignment: {
      Left: 1,
      Right: 2,
    },
  };
});

// Mock vibedrift-shared to avoid import issues
vi.mock("vibedrift-shared", () => ({
  getVibeDriftColor: vi.fn((level: string) => {
    const colors: Record<string, string> = {
      "very-low": "#22c55e",
      low: "#4ade80",
      moderate: "#eab308",
      high: "#f97316",
      "vibe-drift": "#ef4444",
    };
    return colors[level] ?? "#ffffff";
  }),
}));

import * as vscode from "vscode";
import { createStatusBar, updateStatusBar, disposeStatusBar } from "../status-bar";

describe("createStatusBar", () => {
  it("creates a status bar item with correct defaults", () => {
    const item = createStatusBar();

    expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
      vscode.StatusBarAlignment.Left,
      100,
    );
    expect(item.text).toBe("$(pulse) VibeDrift: 0.0");
    expect(item.tooltip).toBe("VibeDrift — monitoring prompts");
    expect(item.show).toHaveBeenCalled();
  });
});

describe("updateStatusBar", () => {
  beforeEach(() => {
    // Create status bar first so the module-level variable is set
    createStatusBar();
  });

  it("updates text with score and level", () => {
    updateStatusBar(3.5, "moderate");

    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]
      .value;
    expect(item.text).toBe("$(pulse) VibeDrift: 3.5 (moderate)");
  });

  it("updates tooltip with detailed info", () => {
    updateStatusBar(3.5, "moderate");

    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]
      .value;
    expect(item.tooltip).toBe("Vibe Drift Score: 3.50\nLevel: moderate");
  });

  it("sets color based on level", () => {
    updateStatusBar(3.5, "moderate");

    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]
      .value;
    expect(item.color).toBe("#eab308");
  });

  it("handles very-low level", () => {
    updateStatusBar(0.5, "very-low");

    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]
      .value;
    expect(item.color).toBe("#22c55e");
    expect(item.text).toBe("$(pulse) VibeDrift: 0.5 (very-low)");
  });

  it("handles vibe-drift level", () => {
    updateStatusBar(10.0, "vibe-drift");

    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]
      .value;
    expect(item.color).toBe("#ef4444");
    expect(item.text).toBe("$(pulse) VibeDrift: 10.0 (vibe-drift)");
  });
});

describe("disposeStatusBar", () => {
  it("disposes the status bar item", () => {
    createStatusBar();
    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]
      .value;

    disposeStatusBar();

    expect(item.dispose).toHaveBeenCalled();
  });
});
