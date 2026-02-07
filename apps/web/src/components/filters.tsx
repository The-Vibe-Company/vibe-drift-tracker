"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function Filters({ projects }: { projects: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentProject = searchParams.get("project") ?? "";
  const currentSince = searchParams.get("since") ?? "";
  const currentUntil = searchParams.get("until") ?? "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentProject}
        onChange={(e) => updateFilter("project", e.target.value)}
        className="cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors hover:border-[var(--primary)]"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--card)",
          color: "var(--foreground)",
        }}
      >
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={currentSince}
        onChange={(e) => updateFilter("since", e.target.value)}
        placeholder="Since"
        className="cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors hover:border-[var(--primary)]"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--card)",
          color: "var(--foreground)",
        }}
      />

      <input
        type="date"
        value={currentUntil}
        onChange={(e) => updateFilter("until", e.target.value)}
        placeholder="Until"
        className="cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors hover:border-[var(--primary)]"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--card)",
          color: "var(--foreground)",
        }}
      />
    </div>
  );
}
