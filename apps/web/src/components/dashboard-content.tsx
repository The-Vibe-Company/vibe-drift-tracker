"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CommitRow } from "@/lib/db/schema";
import { computeVibeDriftScore } from "@vibedrift/shared/dist/types";
import { StatsSummary } from "./stats-summary";
import { CommitTable } from "./commit-table";

function computeStats(commits: CommitRow[]) {
  const totalCommits = commits.length;
  let totalLines = 0;
  let totalPrompts = 0;
  let totalScore = 0;

  for (const c of commits) {
    const prompts = (c.prompts ?? []) as Array<{ text: string }>;
    const promptCount = prompts.length;
    const lines = (c.linesAdded ?? 0) + (c.linesDeleted ?? 0);
    totalLines += lines;
    totalPrompts += promptCount;
    totalScore += computeVibeDriftScore(promptCount, c.linesAdded ?? 0, c.linesDeleted ?? 0);
  }

  return {
    totalCommits,
    avgScore: totalCommits > 0 ? totalScore / totalCommits : 0,
    totalLines,
    totalPrompts,
  };
}

export function DashboardContent({ initialCommits }: { initialCommits: CommitRow[] }) {
  const router = useRouter();
  const [commits, setCommits] = useState(initialCommits);
  const stats = computeStats(commits);

  function handleCommitsChange(newCommits: CommitRow[]) {
    setCommits(newCommits);
    router.refresh();
  }

  return (
    <>
      <div className="mb-6">
        <StatsSummary stats={stats} />
      </div>
      <CommitTable commits={commits} onCommitsChange={handleCommitsChange} />
    </>
  );
}
