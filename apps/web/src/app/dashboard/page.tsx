import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCommits, getProjects } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { DashboardContent } from "@/components/dashboard-content";
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

  const [commitRows, projects] = await Promise.all([
    getCommits({
      userId,
      project: params.project,
      since: params.since,
      until: params.until,
    }),
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

      <DashboardContent initialCommits={commitRows} />
    </main>
  );
}
