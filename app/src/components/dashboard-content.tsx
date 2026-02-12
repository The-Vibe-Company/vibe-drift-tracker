"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CommitRow } from "@/lib/db/schema";
import { computeVibeDriftScore } from "vibedrift-shared/dist/types";
import { StatsSummary } from "./stats-summary";
import { CommitTable } from "./commit-table";

function computeStats(commits: CommitRow[]) {
  const totalCommits = commits.length;
  let totalLines = 0;
  let totalPrompts = 0;
  let totalScore = 0;
  let vibeCommits = 0;

  for (const c of commits) {
    const prompts = (c.prompts ?? []) as Array<{ text: string; codeGenerated?: boolean }>;
    const promptCount = prompts.length;
    const lines = (c.linesAdded ?? 0) + (c.linesDeleted ?? 0);
    totalLines += lines;
    totalPrompts += promptCount;
    if (promptCount > 0) {
      const hasCodeInfo = prompts.some((p) => p.codeGenerated !== undefined);
      const codePromptCount = hasCodeInfo
        ? prompts.filter((p) => p.codeGenerated === true).length
        : prompts.length;
      totalScore += computeVibeDriftScore(codePromptCount, c.linesAdded ?? 0, c.linesDeleted ?? 0);
      vibeCommits++;
    }
  }

  return {
    totalCommits,
    avgScore: vibeCommits > 0 ? totalScore / vibeCommits : 0,
    totalLines,
    totalPrompts,
    linesPerCommit: totalCommits > 0 ? Math.round(totalLines / totalCommits) : 0,
    promptsPerCommit: totalCommits > 0 ? totalPrompts / totalCommits : 0,
  };
}

export function DashboardContent({
  initialCommits,
  totalCommits,
  page,
  pageSize,
  sortBy,
  sortOrder,
  hasApiKeys,
}: {
  initialCommits: CommitRow[];
  totalCommits: number;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  hasApiKeys: boolean;
}) {
  const router = useRouter();
  const [commits, setCommits] = useState(initialCommits);
  const stats = computeStats(commits);

  function handleCommitsChange(newCommits: CommitRow[]) {
    setCommits(newCommits);
    router.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex-shrink-0">
        <StatsSummary stats={{ ...stats, totalCommits }} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <CommitTable
          commits={commits}
          onCommitsChange={handleCommitsChange}
          page={page}
          pageSize={pageSize}
          totalCommits={totalCommits}
          sortBy={sortBy}
          sortOrder={sortOrder}
          hasApiKeys={hasApiKeys}
        />
      </div>
    </div>
  );
}
