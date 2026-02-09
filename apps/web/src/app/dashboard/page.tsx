import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCommits, getCommitCount, getProjects } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { DashboardContent } from "@/components/dashboard-content";
import { Filters } from "@/components/filters";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    project?: string;
    since?: string;
    until?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  const params = await searchParams;

  const pageSize = Math.max(1, parseInt(params.pageSize || "10", 10) || 10);
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const offset = (page - 1) * pageSize;

  const filterParams = {
    userId,
    project: params.project,
    since: params.since,
    until: params.until,
  };

  const [commitRows, totalCommits, projects] = await Promise.all([
    getCommits({ ...filterParams, limit: pageSize, offset }),
    getCommitCount(filterParams),
    getProjects(userId),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="mb-4">
        <Suspense fallback={null}>
          <Filters projects={projects} />
        </Suspense>
      </div>

      <DashboardContent
        key={`${page}-${pageSize}`}
        initialCommits={commitRows}
        totalCommits={totalCommits}
        page={page}
        pageSize={pageSize}
      />
    </main>
  );
}
