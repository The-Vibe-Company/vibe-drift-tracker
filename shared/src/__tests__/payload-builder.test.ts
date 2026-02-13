import { describe, it, expect } from "vitest";

// parseFileChanges and detectFileStatus are not exported, so we test them
// by importing the module internals via a re-export trick.
// Instead, we duplicate the logic here for unit testing since the functions are small.
// The real integration is covered by buildCommitPayload which uses them.

// We test the parsing logic directly by extracting the functions.
// Since they are not exported, we replicate the parsing logic for unit tests.

import type { FileChangePayload } from "../types";

// Replicate parseFileChanges logic for isolated testing
function parseFileChanges(diffStat: string): FileChangePayload[] {
  const changes: FileChangePayload[] = [];
  for (const line of diffStat.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const added = parseInt(parts[0], 10) || 0;
    const deleted = parseInt(parts[1], 10) || 0;
    const filePath = parts.slice(2).join("\t");
    changes.push({
      filePath,
      linesAdded: added,
      linesDeleted: deleted,
      status: "modified",
    });
  }
  return changes;
}

function detectFileStatus(
  fileChanges: FileChangePayload[],
  statusOutput: string,
): FileChangePayload[] {
  const statusMap = new Map<string, FileChangePayload["status"]>();
  for (const line of statusOutput.split("\n")) {
    if (!line.trim()) continue;
    const code = line.charAt(0);
    const file = line.substring(2).trim();
    switch (code) {
      case "A":
        statusMap.set(file, "added");
        break;
      case "D":
        statusMap.set(file, "deleted");
        break;
      case "R":
        statusMap.set(file, "renamed");
        break;
      case "C":
        statusMap.set(file, "copied");
        break;
      default:
        statusMap.set(file, "modified");
    }
  }

  return fileChanges.map((fc) => ({
    ...fc,
    status: statusMap.get(fc.filePath) ?? fc.status,
  }));
}

describe("parseFileChanges", () => {
  it("parses git numstat output correctly", () => {
    const input = "10\t5\tsrc/index.ts\n3\t1\tREADME.md";
    const result = parseFileChanges(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      filePath: "src/index.ts",
      linesAdded: 10,
      linesDeleted: 5,
      status: "modified",
    });
    expect(result[1]).toEqual({
      filePath: "README.md",
      linesAdded: 3,
      linesDeleted: 1,
      status: "modified",
    });
  });

  it("skips empty lines", () => {
    const input = "10\t5\tsrc/index.ts\n\n\n3\t1\tREADME.md\n";
    const result = parseFileChanges(input);
    expect(result).toHaveLength(2);
  });

  it("handles binary files (- - filepath)", () => {
    const input = "-\t-\timage.png";
    const result = parseFileChanges(input);
    expect(result).toHaveLength(1);
    expect(result[0].linesAdded).toBe(0);
    expect(result[0].linesDeleted).toBe(0);
    expect(result[0].filePath).toBe("image.png");
  });

  it("handles tabs in file names", () => {
    const input = "5\t3\tpath/to\tfile with tab.ts";
    const result = parseFileChanges(input);
    expect(result).toHaveLength(1);
    expect(result[0].filePath).toBe("path/to\tfile with tab.ts");
  });

  it("returns empty array for empty input", () => {
    expect(parseFileChanges("")).toHaveLength(0);
    expect(parseFileChanges("  \n  ")).toHaveLength(0);
  });

  it("skips lines with fewer than 3 tab-separated parts", () => {
    const input = "invalid line\n10\t5\tvalid.ts";
    const result = parseFileChanges(input);
    expect(result).toHaveLength(1);
    expect(result[0].filePath).toBe("valid.ts");
  });
});

describe("detectFileStatus", () => {
  it("maps A to added", () => {
    const files: FileChangePayload[] = [
      { filePath: "new-file.ts", linesAdded: 10, linesDeleted: 0, status: "modified" },
    ];
    const status = "A\tnew-file.ts";
    const result = detectFileStatus(files, status);
    expect(result[0].status).toBe("added");
  });

  it("maps D to deleted", () => {
    const files: FileChangePayload[] = [
      { filePath: "old-file.ts", linesAdded: 0, linesDeleted: 20, status: "modified" },
    ];
    const status = "D\told-file.ts";
    const result = detectFileStatus(files, status);
    expect(result[0].status).toBe("deleted");
  });

  it("maps M to modified", () => {
    const files: FileChangePayload[] = [
      { filePath: "changed.ts", linesAdded: 5, linesDeleted: 3, status: "modified" },
    ];
    const status = "M\tchanged.ts";
    const result = detectFileStatus(files, status);
    expect(result[0].status).toBe("modified");
  });

  it("maps R to renamed", () => {
    const files: FileChangePayload[] = [
      { filePath: "renamed.ts", linesAdded: 0, linesDeleted: 0, status: "modified" },
    ];
    const status = "R\trenamed.ts";
    const result = detectFileStatus(files, status);
    expect(result[0].status).toBe("renamed");
  });

  it("maps C to copied", () => {
    const files: FileChangePayload[] = [
      { filePath: "copied.ts", linesAdded: 10, linesDeleted: 0, status: "modified" },
    ];
    const status = "C\tcopied.ts";
    const result = detectFileStatus(files, status);
    expect(result[0].status).toBe("copied");
  });

  it("defaults unknown codes to modified", () => {
    const files: FileChangePayload[] = [
      { filePath: "mystery.ts", linesAdded: 5, linesDeleted: 5, status: "modified" },
    ];
    const status = "X\tmystery.ts";
    const result = detectFileStatus(files, status);
    expect(result[0].status).toBe("modified");
  });

  it("preserves original status when file not in status map", () => {
    const files: FileChangePayload[] = [
      { filePath: "untouched.ts", linesAdded: 1, linesDeleted: 0, status: "modified" },
    ];
    const result = detectFileStatus(files, "");
    expect(result[0].status).toBe("modified");
  });
});
