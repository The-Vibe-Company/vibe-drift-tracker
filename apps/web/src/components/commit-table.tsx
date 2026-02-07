import type { CommitRow } from "@/lib/db/schema";
import { DriftBadge } from "./drift-badge";

export function CommitTable({ commits }: { commits: CommitRow[] }) {
  if (commits.length === 0) {
    return (
      <div
        className="rounded-lg border p-8 text-center"
        style={{
          borderColor: "var(--border)",
          color: "var(--muted-foreground)",
        }}
      >
        No commits yet. Push some data via the API, VS Code extension, or
        post-commit hook.
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border"
      style={{ borderColor: "var(--border)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-left"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--muted)",
            }}
          >
            <th className="px-4 py-3 font-medium">Commit</th>
            <th className="px-4 py-3 font-medium">Message</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Author</th>
            <th className="px-4 py-3 font-medium text-right">Lines</th>
            <th className="px-4 py-3 font-medium text-right">Prompts</th>
            <th className="px-4 py-3 font-medium">Drift</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {commits.map((commit) => (
            <tr
              key={commit.id}
              className="border-b transition-colors hover:opacity-80"
              style={{ borderColor: "var(--border)" }}
            >
              <td className="px-4 py-3 font-mono text-xs">
                {commit.commitHash.slice(0, 7)}
              </td>
              <td className="max-w-[300px] truncate px-4 py-3">
                {commit.message}
              </td>
              <td className="px-4 py-3">{commit.projectName}</td>
              <td className="px-4 py-3">{commit.author}</td>
              <td className="px-4 py-3 text-right font-mono">
                <span style={{ color: "#22c55e" }}>
                  +{commit.linesAdded ?? 0}
                </span>
                {" / "}
                <span style={{ color: "#ef4444" }}>
                  -{commit.linesDeleted ?? 0}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {commit.userPrompts ?? 0}
              </td>
              <td className="px-4 py-3">
                <DriftBadge
                  score={commit.vibeDriftScore ?? 0}
                  level={commit.vibeDriftLevel ?? "low"}
                />
              </td>
              <td className="px-4 py-3">
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }}
                >
                  {commit.source}
                </span>
              </td>
              <td
                className="whitespace-nowrap px-4 py-3 text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                {commit.committedAt
                  ? new Date(commit.committedAt).toLocaleDateString()
                  : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
