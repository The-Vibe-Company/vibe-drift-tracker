import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  encodeProjectPath,
  parseSessionFile,
  findClaudeProjectDirs,
  getSessionsInWindow,
  parseClaudeSessions,
} from "../claude-parser";

describe("encodeProjectPath", () => {
  it("replaces forward slashes with dashes", () => {
    expect(encodeProjectPath("/Users/foo/Dev")).toBe("-Users-foo-Dev");
  });

  it("handles root path", () => {
    expect(encodeProjectPath("/")).toBe("-");
  });

  it("handles path with no leading slash", () => {
    expect(encodeProjectPath("Users/foo")).toBe("Users-foo");
  });

  it("handles single segment", () => {
    expect(encodeProjectPath("project")).toBe("project");
  });

  it("handles empty string", () => {
    expect(encodeProjectPath("")).toBe("");
  });
});

describe("parseSessionFile", () => {
  const tmpDir = path.join(__dirname, ".tmp-test");
  const since = new Date("2024-01-01T00:00:00Z");
  const until = new Date("2024-12-31T23:59:59Z");

  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeSession(filename: string, lines: object[]): string {
    const filePath = path.join(tmpDir, filename);
    const content = lines.map((l) => JSON.stringify(l)).join("\n");
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  it("returns null for non-existent file", () => {
    const result = parseSessionFile("/non/existent/file.jsonl", since, until);
    expect(result).toBeNull();
  });

  it("returns null for empty session (no prompts, no responses)", () => {
    const filePath = writeSession("empty.jsonl", [
      { type: "summary", timestamp: "2024-06-01T10:00:00Z" },
    ]);
    const result = parseSessionFile(filePath, since, until);
    expect(result).toBeNull();
  });

  it("parses a valid session with user prompts and AI responses", () => {
    const filePath = writeSession("valid.jsonl", [
      {
        type: "user",
        sessionId: "sess-1",
        timestamp: "2024-06-01T10:00:00Z",
        message: { role: "user", content: "Add a login button" },
      },
      {
        type: "assistant",
        sessionId: "sess-1",
        timestamp: "2024-06-01T10:01:00Z",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "Here's the code" },
            { type: "tool_use", name: "Write", id: "t1" },
          ],
        },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(1);
    expect(result!.aiResponses).toBe(1);
    expect(result!.toolCalls).toBe(1);
    expect(result!.sessionId).toBe("sess-1");
    expect(result!.prompts).toHaveLength(1);
    expect(result!.prompts![0].text).toBe("Add a login button");
    expect(result!.prompts![0].codeGenerated).toBe(true);
  });

  it("filters messages outside the time window", () => {
    const filePath = writeSession("outside.jsonl", [
      {
        type: "user",
        sessionId: "sess-2",
        timestamp: "2023-01-01T10:00:00Z", // Before window
        message: { role: "user", content: "Old prompt" },
      },
      {
        type: "assistant",
        sessionId: "sess-2",
        timestamp: "2023-01-01T10:01:00Z",
        message: { role: "assistant", content: "Old response" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).toBeNull();
  });

  it("skips meta messages", () => {
    const filePath = writeSession("meta.jsonl", [
      {
        type: "user",
        sessionId: "sess-3",
        timestamp: "2024-06-01T10:00:00Z",
        isMeta: true,
        message: { role: "user", content: "Some meta thing" },
      },
      {
        type: "assistant",
        sessionId: "sess-3",
        timestamp: "2024-06-01T10:01:00Z",
        message: { role: "assistant", content: "Response" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    // Only AI response counted, no user prompts
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(0);
    expect(result!.aiResponses).toBe(1);
  });

  it("skips sidechain messages", () => {
    const filePath = writeSession("sidechain.jsonl", [
      {
        type: "user",
        sessionId: "sess-4",
        timestamp: "2024-06-01T10:00:00Z",
        isSidechain: true,
        message: { role: "user", content: "Sidechain prompt" },
      },
      {
        type: "assistant",
        sessionId: "sess-4",
        timestamp: "2024-06-01T10:01:00Z",
        message: { role: "assistant", content: "Response" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(0);
  });

  it("skips system-generated prompts", () => {
    const filePath = writeSession("system.jsonl", [
      {
        type: "user",
        sessionId: "sess-5",
        timestamp: "2024-06-01T10:00:00Z",
        message: { role: "user", content: "[Request interrupted by user]" },
      },
      {
        type: "user",
        sessionId: "sess-5",
        timestamp: "2024-06-01T10:01:00Z",
        message: {
          role: "user",
          content: "Implement the following plan: do something",
        },
      },
      {
        type: "user",
        sessionId: "sess-5",
        timestamp: "2024-06-01T10:02:00Z",
        message: {
          role: "user",
          content: "<task-notification>some notification</task-notification>",
        },
      },
      {
        type: "assistant",
        sessionId: "sess-5",
        timestamp: "2024-06-01T10:03:00Z",
        message: { role: "assistant", content: "Response" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(0);
    expect(result!.aiResponses).toBe(1);
  });

  it("skips command messages", () => {
    const filePath = writeSession("command.jsonl", [
      {
        type: "user",
        sessionId: "sess-6",
        timestamp: "2024-06-01T10:00:00Z",
        message: { role: "user", content: "<command-name>help</command-name>" },
      },
      {
        type: "assistant",
        sessionId: "sess-6",
        timestamp: "2024-06-01T10:01:00Z",
        message: { role: "assistant", content: "Help text" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(0);
  });

  it("handles malformed JSON lines gracefully", () => {
    const filePath = path.join(tmpDir, "malformed.jsonl");
    fs.writeFileSync(
      filePath,
      'not json at all\n{"type":"user","sessionId":"s","timestamp":"2024-06-01T10:00:00Z","message":{"role":"user","content":"Hello"}}\n{broken json\n{"type":"assistant","sessionId":"s","timestamp":"2024-06-01T10:01:00Z","message":{"role":"assistant","content":"Hi"}}',
    );

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(1);
    expect(result!.aiResponses).toBe(1);
  });

  it("skips file-history-snapshot and summary entries", () => {
    const filePath = writeSession("snapshots.jsonl", [
      { type: "file-history-snapshot", timestamp: "2024-06-01T10:00:00Z" },
      { type: "summary", timestamp: "2024-06-01T10:00:00Z" },
      {
        type: "user",
        sessionId: "sess-7",
        timestamp: "2024-06-01T10:00:00Z",
        message: { role: "user", content: "Real prompt" },
      },
      {
        type: "assistant",
        sessionId: "sess-7",
        timestamp: "2024-06-01T10:01:00Z",
        message: { role: "assistant", content: "Real response" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(1);
    expect(result!.aiResponses).toBe(1);
  });

  it("counts tool calls in assistant responses", () => {
    const filePath = writeSession("tools.jsonl", [
      {
        type: "user",
        sessionId: "sess-8",
        timestamp: "2024-06-01T10:00:00Z",
        message: { role: "user", content: "Write some code" },
      },
      {
        type: "assistant",
        sessionId: "sess-8",
        timestamp: "2024-06-01T10:01:00Z",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "Let me write that" },
            { type: "tool_use", name: "Write", id: "t1" },
            { type: "tool_use", name: "Edit", id: "t2" },
            { type: "tool_use", name: "Read", id: "t3" },
          ],
        },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.toolCalls).toBe(3);
    expect(result!.prompts![0].codeGenerated).toBe(true);
  });

  it("marks codeGenerated false when no code tools used", () => {
    const filePath = writeSession("nocode.jsonl", [
      {
        type: "user",
        sessionId: "sess-9",
        timestamp: "2024-06-01T10:00:00Z",
        message: { role: "user", content: "Explain this code" },
      },
      {
        type: "assistant",
        sessionId: "sess-9",
        timestamp: "2024-06-01T10:01:00Z",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "Here's the explanation" },
            { type: "tool_use", name: "Read", id: "t1" },
          ],
        },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.prompts![0].codeGenerated).toBe(false);
  });

  it("truncates prompt text to 500 chars", () => {
    const longText = "a".repeat(1000);
    const filePath = writeSession("long.jsonl", [
      {
        type: "user",
        sessionId: "sess-10",
        timestamp: "2024-06-01T10:00:00Z",
        message: { role: "user", content: longText },
      },
      {
        type: "assistant",
        sessionId: "sess-10",
        timestamp: "2024-06-01T10:01:00Z",
        message: { role: "assistant", content: "Response" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.prompts![0].text).toHaveLength(500);
  });

  it("excludes last prompt if it has no response yet", () => {
    const filePath = writeSession("pending.jsonl", [
      {
        type: "user",
        sessionId: "sess-11",
        timestamp: "2024-06-01T10:00:00Z",
        message: { role: "user", content: "First prompt" },
      },
      {
        type: "assistant",
        sessionId: "sess-11",
        timestamp: "2024-06-01T10:01:00Z",
        message: { role: "assistant", content: "First response" },
      },
      {
        type: "user",
        sessionId: "sess-11",
        timestamp: "2024-06-01T10:02:00Z",
        message: { role: "user", content: "Second prompt no response" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(1);
    expect(result!.prompts).toHaveLength(1);
    expect(result!.prompts![0].text).toBe("First prompt");
  });

  it("handles content as array of blocks", () => {
    const filePath = writeSession("blocks.jsonl", [
      {
        type: "user",
        sessionId: "sess-12",
        timestamp: "2024-06-01T10:00:00Z",
        message: {
          role: "user",
          content: [
            { type: "text", text: "Part one " },
            { type: "text", text: "Part two" },
          ],
        },
      },
      {
        type: "assistant",
        sessionId: "sess-12",
        timestamp: "2024-06-01T10:01:00Z",
        message: { role: "assistant", content: "Response" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(1);
    expect(result!.prompts![0].text).toBe("Part one Part two");
  });

  it("strips interrupt prefix from real messages", () => {
    const filePath = writeSession("interrupt.jsonl", [
      {
        type: "user",
        sessionId: "sess-13",
        timestamp: "2024-06-01T10:00:00Z",
        message: {
          role: "user",
          content: "[Request interrupted by user] Actually do this instead",
        },
      },
      {
        type: "assistant",
        sessionId: "sess-13",
        timestamp: "2024-06-01T10:01:00Z",
        message: { role: "assistant", content: "OK" },
      },
    ]);

    const result = parseSessionFile(filePath, since, until);
    expect(result).not.toBeNull();
    expect(result!.userPrompts).toBe(1);
    expect(result!.prompts![0].text).toBe("Actually do this instead");
  });
});

describe("findClaudeProjectDirs", () => {
  const tmpHome = path.join(__dirname, ".tmp-home");
  const claudeProjectsDir = path.join(tmpHome, ".claude", "projects");
  let originalHome: string | undefined;

  beforeEach(() => {
    originalHome = process.env.HOME;
    process.env.HOME = tmpHome;
    fs.mkdirSync(claudeProjectsDir, { recursive: true });
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it("returns empty array when .claude/projects does not exist", () => {
    fs.rmSync(claudeProjectsDir, { recursive: true, force: true });
    fs.rmSync(path.join(tmpHome, ".claude"), { recursive: true, force: true });
    const result = findClaudeProjectDirs("/Users/foo/Dev");
    expect(result).toEqual([]);
  });

  it("finds matching project directories", () => {
    const dirName = "-Users-foo-Dev";
    fs.mkdirSync(path.join(claudeProjectsDir, dirName), { recursive: true });
    fs.mkdirSync(path.join(claudeProjectsDir, "-Other-project"), { recursive: true });

    const result = findClaudeProjectDirs("/Users/foo/Dev");
    expect(result).toHaveLength(1);
    expect(result[0]).toContain(dirName);
  });

  it("matches parent path directories", () => {
    const parentDir = "-Users-foo";
    const childDir = "-Users-foo-Dev";
    fs.mkdirSync(path.join(claudeProjectsDir, parentDir), { recursive: true });
    fs.mkdirSync(path.join(claudeProjectsDir, childDir), { recursive: true });

    const result = findClaudeProjectDirs("/Users/foo/Dev");
    expect(result).toHaveLength(2);
  });
});

describe("getSessionsInWindow", () => {
  const tmpDir = path.join(__dirname, ".tmp-sessions");
  const since = new Date("2024-06-01T00:00:00Z");
  const until = new Date("2024-06-30T23:59:59Z");

  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty array for empty directory", () => {
    const result = getSessionsInWindow([tmpDir], since, until);
    expect(result).toEqual([]);
  });

  it("finds .jsonl files within time window", () => {
    const sessionFile = path.join(tmpDir, "session-abc.jsonl");
    fs.writeFileSync(sessionFile, '{"type":"user"}\n');
    // The file's mtime is "now" which is after since, and birthtime is before until

    const result = getSessionsInWindow(
      [tmpDir],
      new Date("2020-01-01"),
      new Date("2030-01-01"),
    );
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].sessionId).toBe("session-abc");
    expect(result[0].fullPath).toBe(sessionFile);
  });

  it("skips non-jsonl files", () => {
    fs.writeFileSync(path.join(tmpDir, "readme.txt"), "hello");
    const result = getSessionsInWindow(
      [tmpDir],
      new Date("2020-01-01"),
      new Date("2030-01-01"),
    );
    expect(result).toEqual([]);
  });

  it("deduplicates sessions across directories", () => {
    const dir2 = path.join(tmpDir, "dir2");
    fs.mkdirSync(dir2, { recursive: true });

    fs.writeFileSync(path.join(tmpDir, "sess-1.jsonl"), "{}");
    fs.writeFileSync(path.join(dir2, "sess-1.jsonl"), "{}");

    const result = getSessionsInWindow(
      [tmpDir, dir2],
      new Date("2020-01-01"),
      new Date("2030-01-01"),
    );
    expect(result).toHaveLength(1);
  });

  it("reads sessions-index.json for external session files", () => {
    // External file must be outside the scanned directory
    const externalDir = path.join(tmpDir, "..", ".tmp-external-sessions");
    fs.mkdirSync(externalDir, { recursive: true });

    const externalFile = path.join(externalDir, "ext-session.jsonl");
    fs.writeFileSync(externalFile, '{"type":"user"}\n');

    const indexPath = path.join(tmpDir, "sessions-index.json");
    const index = {
      version: 1,
      entries: [
        {
          sessionId: "ext-session",
          fullPath: externalFile,
          fileMtime: Date.now(),
          messageCount: 1,
          created: "2024-06-15T10:00:00Z",
          modified: "2024-06-15T11:00:00Z",
          projectPath: "/test",
        },
      ],
      originalPath: "/test",
    };
    fs.writeFileSync(indexPath, JSON.stringify(index));

    try {
      const result = getSessionsInWindow(
        [tmpDir],
        since,
        until,
      );

      const extSession = result.find((s) => s.sessionId === "ext-session");
      expect(extSession).toBeDefined();
      expect(extSession!.fullPath).toBe(externalFile);
    } finally {
      fs.rmSync(externalDir, { recursive: true, force: true });
    }
  });
});

describe("parseClaudeSessions", () => {
  const tmpHome = path.join(__dirname, ".tmp-claude-sessions");
  let originalHome: string | undefined;

  beforeEach(() => {
    originalHome = process.env.HOME;
    process.env.HOME = tmpHome;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it("returns zero aggregate when no project dirs found", () => {
    const result = parseClaudeSessions(
      "/non/existent/project",
      new Date("2024-01-01"),
      new Date("2024-12-31"),
    );

    expect(result.aggregate.userPrompts).toBe(0);
    expect(result.aggregate.aiResponses).toBe(0);
    expect(result.sessions).toHaveLength(0);
  });

  it("aggregates stats across multiple sessions", () => {
    const projectPath = "/Users/test/MyProject";
    const encoded = encodeProjectPath(projectPath);
    const projectDir = path.join(tmpHome, ".claude", "projects", encoded);
    fs.mkdirSync(projectDir, { recursive: true });

    // Session 1
    const session1 = [
      {
        type: "user",
        sessionId: "s1",
        timestamp: "2024-06-01T10:00:00Z",
        message: { role: "user", content: "First prompt" },
      },
      {
        type: "assistant",
        sessionId: "s1",
        timestamp: "2024-06-01T10:01:00Z",
        message: { role: "assistant", content: "Response 1" },
      },
    ];
    fs.writeFileSync(
      path.join(projectDir, "s1.jsonl"),
      session1.map((l) => JSON.stringify(l)).join("\n"),
    );

    // Session 2
    const session2 = [
      {
        type: "user",
        sessionId: "s2",
        timestamp: "2024-06-01T11:00:00Z",
        message: { role: "user", content: "Second prompt" },
      },
      {
        type: "assistant",
        sessionId: "s2",
        timestamp: "2024-06-01T11:01:00Z",
        message: { role: "assistant", content: "Response 2" },
      },
    ];
    fs.writeFileSync(
      path.join(projectDir, "s2.jsonl"),
      session2.map((l) => JSON.stringify(l)).join("\n"),
    );

    const result = parseClaudeSessions(
      projectPath,
      new Date("2024-01-01"),
      new Date("2030-12-31"),
    );

    expect(result.sessions).toHaveLength(2);
    expect(result.aggregate.userPrompts).toBe(2);
    expect(result.aggregate.aiResponses).toBe(2);
    expect(result.aggregate.totalInteractions).toBe(4);
    expect(result.aggregate.sessionId).toBe("aggregate");
    expect(result.aggregate.prompts).toHaveLength(2);
  });
});
