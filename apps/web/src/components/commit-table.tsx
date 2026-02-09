"use client";

import { Fragment, useState } from "react";
import type { CommitRow } from "@/lib/db/schema";
import { computeVibeDriftScore, getVibeDriftLevel } from "@vibedrift/shared/dist/types";
import { DriftBadge } from "./drift-badge";
import { Pagination } from "./pagination";

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

function PromptModal({
  prompt,
  index,
  onClose,
}: {
  prompt: { text: string; timestamp: string };
  index: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border p-6"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--muted-foreground)" }}
          >
            Prompt {index + 1}
            {prompt.timestamp && (
              <span className="ml-2 font-normal">
                {formatRelativeTime(prompt.timestamp)}
              </span>
            )}
          </span>
          <button
            className="rounded p-1 transition-colors hover:bg-white/10"
            style={{ color: "var(--muted-foreground)" }}
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p
          className="whitespace-pre-wrap font-mono text-sm leading-relaxed"
          style={{ color: "var(--foreground)" }}
        >
          {prompt.text}
        </p>
      </div>
    </div>
  );
}

function DetailPanel({ commit }: { commit: CommitRow }) {
  const prompts = (commit.prompts ?? []) as Array<{ text: string; timestamp: string; sessionId: string }>;
  const [modalPrompt, setModalPrompt] = useState<number | null>(null);
  const [hoveredPrompt, setHoveredPrompt] = useState<number | null>(null);

  const promptCount = prompts.length;

  const ratio =
    promptCount > 0
      ? (
          ((commit.linesAdded ?? 0) + (commit.linesDeleted ?? 0)) /
          promptCount
        ).toFixed(1)
      : "—";

  const stats = [
    { label: "User Prompts", value: promptCount },
    { label: "Files Changed", value: commit.filesChanged ?? 0 },
    { label: "Lines / Prompt", value: ratio },
  ];

  return (
    <td colSpan={8}>
      <div
        className="px-4 py-4"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.015)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {/* Stats row */}
        <div className="flex items-center gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <span
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                {s.label}
              </span>
              <span className="text-sm font-medium">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Commit message */}
        {commit.message && (
          <p
            className="mt-2 max-w-[640px] truncate text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span className="mr-1.5">Commit message:</span>
            <span style={{ color: "var(--foreground)" }}>{commit.message}</span>
          </p>
        )}

        {/* Prompt history */}
        <div className="mt-4">
          <p
            className="mb-2 text-xs font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            Prompt History ({prompts.length || 0})
          </p>
          {prompts.length === 0 ? (
            <p
              className="text-xs italic"
              style={{ color: "var(--muted-foreground)" }}
            >
              No prompt data available
            </p>
          ) : (
            <ol className="space-y-0.5">
              {prompts.map((p, i) => (
                <li
                  key={i}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors"
                  style={{
                    backgroundColor:
                      hoveredPrompt === i
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(255, 255, 255, 0.02)",
                  }}
                  onMouseEnter={() => setHoveredPrompt(i)}
                  onMouseLeave={() => setHoveredPrompt(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalPrompt(i);
                  }}
                >
                  <span
                    className="flex-shrink-0 text-xs font-medium tabular-nums"
                    style={{ color: "var(--muted-foreground)", minWidth: "1.25rem" }}
                  >
                    {i + 1}
                  </span>
                  <p
                    className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs"
                    style={{ color: "var(--foreground)" }}
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
                  <span
                    className="flex-shrink-0 text-xs transition-opacity"
                    style={{
                      color: "var(--muted-foreground)",
                      opacity: hoveredPrompt === i ? 1 : 0,
                    }}
                  >
                    →
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {modalPrompt !== null && prompts[modalPrompt] && (
          <PromptModal
            prompt={prompts[modalPrompt]}
            index={modalPrompt}
            onClose={() => setModalPrompt(null)}
          />
        )}
      </div>
    </td>
  );
}

export function CommitTable({
  commits,
  onCommitsChange,
  page,
  pageSize,
  totalCommits,
}: {
  commits: CommitRow[];
  onCommitsChange?: (commits: CommitRow[]) => void;
  page: number;
  pageSize: number;
  totalCommits: number;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);

  async function handleDelete(e: React.MouseEvent, commitId: number) {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(commitId);
    try {
      const res = await fetch(`/api/commits/${commitId}`, { method: "DELETE" });
      if (res.ok) {
        const updated = commits.filter((c) => c.id !== commitId);
        if (expandedId === commitId) setExpandedId(null);
        onCommitsChange?.(updated);
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
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--border)" }}
    >
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col style={{ width: "15%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "33%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "9%" }} />
          <col />
        </colgroup>
        <thead>
          <tr
            className="border-b text-left"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--muted)",
            }}
          >
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Drift</th>
            <th className="px-4 py-3 font-medium text-right">Lines</th>
            <th className="px-4 py-3 font-medium text-right">Prompts</th>
            <th className="px-4 py-3 font-medium">Branch</th>
            <th className="px-4 py-3 font-medium">Commit</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {commits.map((commit) => {
            const isExpanded = expandedId === commit.id;
            const prompts = (commit.prompts ?? []) as Array<{ text: string }>;
            const promptCount = prompts.length;
            const driftScore = computeVibeDriftScore(promptCount, commit.linesAdded ?? 0, commit.linesDeleted ?? 0);
            const driftLevel = getVibeDriftLevel(driftScore);
            return (
              <Fragment key={commit.id}>
                <tr
                  className="border-b cursor-pointer transition-colors"
                  style={{
                    borderColor: isExpanded ? "transparent" : "var(--border)",
                    backgroundColor: isExpanded
                      ? "rgba(255, 255, 255, 0.03)"
                      : hoveredRowId === commit.id
                        ? "rgba(255, 255, 255, 0.02)"
                        : undefined,
                    ...(isExpanded && {
                      boxShadow:
                        "inset 1px 0 0 rgba(250, 204, 21, 0.3), inset -1px 0 0 rgba(250, 204, 21, 0.3), inset 0 1px 0 rgba(250, 204, 21, 0.3)",
                    }),
                  }}
                  onMouseEnter={() => !isExpanded && setHoveredRowId(commit.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : commit.id)
                  }
                >
                  <td className="truncate px-4 py-3">{commit.projectName}</td>
                  <td className="px-4 py-3">
                    <DriftBadge
                      score={driftScore}
                      level={driftLevel}
                    />
                  </td>
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
                    {promptCount}
                  </td>
                  <td className="truncate px-4 py-3">
                    {commit.branch}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {commit.commitHash.slice(0, 7)}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3 text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {commit.committedAt
                      ? formatRelativeTime(new Date(commit.committedAt).toISOString())
                      : ""}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      className="rounded p-1 transition-colors hover:bg-red-500/20 disabled:opacity-30"
                      style={{ color: "var(--muted-foreground)" }}
                      title="Delete commit"
                      disabled={deletingId === commit.id}
                      onClick={(e) => handleDelete(e, commit.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr
                    key={`${commit.id}-detail`}
                    className="border-b"
                    style={{
                      borderColor: "var(--border)",
                      boxShadow:
                        "inset 1px 0 0 rgba(250, 204, 21, 0.3), inset -1px 0 0 rgba(250, 204, 21, 0.3), inset 0 -1px 0 rgba(250, 204, 21, 0.3)",
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
      <Pagination page={page} pageSize={pageSize} totalItems={totalCommits} />
    </div>
  );
}
