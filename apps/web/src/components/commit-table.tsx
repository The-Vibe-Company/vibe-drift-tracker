"use client";

import { Fragment, useState } from "react";
import type { CommitRow } from "@/lib/db/schema";
import { DriftBadge } from "./drift-badge";

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function DetailPanel({ commit }: { commit: CommitRow }) {
  const prompts = (commit.prompts ?? []) as Array<{ text: string; timestamp: string; sessionId: string }>;

  const promptCount = prompts.length;
  const stats = [
    { label: "User Prompts", value: promptCount },
    { label: "Files Changed", value: commit.filesChanged ?? 0 },
  ];

  const ratio =
    promptCount > 0
      ? (
          ((commit.linesAdded ?? 0) + (commit.linesDeleted ?? 0)) /
          promptCount
        ).toFixed(1)
      : "—";

  return (
    <td colSpan={10} className="px-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              {s.label}
            </p>
            <p className="text-lg font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-4 text-xs"
        style={{ color: "var(--muted-foreground)" }}
      >
        <span>
          Lines / Prompt: <strong style={{ color: "var(--foreground)" }}>{ratio}</strong>
        </span>
        <span>
          Branch: <strong style={{ color: "var(--foreground)" }}>{commit.branch}</strong>
        </span>
        {commit.message && (
          <span className="max-w-md truncate">
            Message: <strong style={{ color: "var(--foreground)" }}>{commit.message}</strong>
          </span>
        )}
      </div>

      {/* Exchange history */}
      <div className="mt-4">
        <p
          className="mb-2 text-xs font-medium"
          style={{ color: "var(--muted-foreground)" }}
        >
          Exchange History ({prompts.length || 0})
        </p>
        {prompts.length === 0 ? (
          <p
            className="rounded-md px-3 py-2 text-xs italic"
            style={{
              backgroundColor: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            No prompt data available
          </p>
        ) : (
          <ol className="space-y-2">
            {prompts.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-md px-3 py-2"
                style={{ backgroundColor: "var(--muted)" }}
              >
                <span
                  className="mt-0.5 flex-shrink-0 text-xs font-semibold"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  #{i + 1}
                </span>
                <p
                  className="min-w-0 flex-1 truncate font-mono text-xs"
                  style={{ color: "var(--foreground)" }}
                  title={p.text}
                >
                  {p.text}
                </p>
                {p.timestamp && (
                  <span
                    className="flex-shrink-0 text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {formatRelativeTime(p.timestamp)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </td>
  );
}

export function CommitTable({ commits: initialCommits }: { commits: CommitRow[] }) {
  const [commits, setCommits] = useState(initialCommits);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(e: React.MouseEvent, commitId: number) {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(commitId);
    try {
      const res = await fetch(`/api/commits/${commitId}`, { method: "DELETE" });
      if (res.ok) {
        setCommits((prev) => prev.filter((c) => c.id !== commitId));
        if (expandedId === commitId) setExpandedId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

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
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {commits.map((commit) => {
            const isExpanded = expandedId === commit.id;
            return (
              <Fragment key={commit.id}>
                <tr
                  className="border-b cursor-pointer transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: isExpanded
                      ? "rgba(250, 204, 21, 0.05)"
                      : undefined,
                  }}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : commit.id)
                  }
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
                      ? new Date(commit.committedAt).toLocaleDateString("en-US")
                      : ""}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded p-1 text-xs transition-colors hover:bg-red-500/20"
                      style={{ color: "var(--muted-foreground)" }}
                      title="Delete commit"
                      disabled={deletingId === commit.id}
                      onClick={(e) => handleDelete(e, commit.id)}
                    >
                      {deletingId === commit.id ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr
                    key={`${commit.id}-detail`}
                    className="border-b"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "rgba(250, 204, 21, 0.03)",
                    }}
                  >
                    <DetailPanel commit={commit} />
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
