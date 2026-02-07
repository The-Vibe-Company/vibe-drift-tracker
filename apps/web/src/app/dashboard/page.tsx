import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCommits, getProjects, getStats } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { CommitTable } from "@/components/commit-table";
import { StatsSummary } from "@/components/stats-summary";
import { Filters } from "@/components/filters";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; since?: string; until?: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  const params = await searchParams;

  const [commitRows, projects, stats] = await Promise.all([
    getCommits({
      userId,
      project: params.project,
      since: params.since,
      until: params.until,
    }),
    getProjects(userId),
    getStats(params.project, userId),
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
