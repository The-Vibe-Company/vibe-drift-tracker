import { Suspense } from "react";
import { getCommits, getProjects, getStats } from "@/lib/db";
import { CommitTable } from "@/components/commit-table";
import { StatsSummary } from "@/components/stats-summary";
import { Filters } from "@/components/filters";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; since?: string; until?: string }>;
}) {
  const params = await searchParams;

  const [commitRows, projects, stats] = await Promise.all([
    getCommits({
      project: params.project,
      since: params.since,
      until: params.until,
    }),
    getProjects(),
    getStats(params.project),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          VibeDriftTracker
        </h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Monitor your AI-assisted development vibe drift across projects
        </p>
      </div>

      <div className="mb-6">
        <StatsSummary stats={stats} />
      </div>

      <div className="mb-4">
        <Suspense fallback={null}>
          <Filters projects={projects} />
        </Suspense>
      </div>

      <CommitTable commits={commitRows} />
    </main>
  );
}
