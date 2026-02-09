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
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  const params = await searchParams;

  const pageSize = Math.max(1, parseInt(params.pageSize || "25", 10) || 25);
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const offset = (page - 1) * pageSize;

  const sortBy = params.sortBy;
  const sortOrder = params.sortOrder === "asc" ? "asc" as const : params.sortOrder === "desc" ? "desc" as const : undefined;

  const filterParams = {
    userId,
    project: params.project,
    since: params.since,
    until: params.until,
  };

  const [commitRows, totalCommits, projects] = await Promise.all([
    getCommits({ ...filterParams, limit: pageSize, offset, sortBy, sortOrder }),
    getCommitCount(filterParams),
    getProjects(userId),
  ]);

  return (
    <main className="mx-auto flex h-screen max-w-7xl flex-col overflow-hidden px-4 py-8">
      <h1 className="mb-6 flex-shrink-0 text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="mb-4 flex-shrink-0">
        <Suspense fallback={null}>
          <Filters projects={projects} />
        </Suspense>
      </div>

      <DashboardContent
        key={`${page}-${pageSize}-${params.project || ''}-${params.since || ''}-${params.until || ''}-${sortBy || ''}-${sortOrder || ''}`}
        initialCommits={commitRows}
        totalCommits={totalCommits}
        page={page}
        pageSize={pageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </main>
  );
}
