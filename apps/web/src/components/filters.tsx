"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Dropdown({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex min-w-[10rem] items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
        style={{
          borderColor: open ? "var(--primary)" : "var(--border)",
          backgroundColor: "var(--card)",
          color: selected ? "var(--foreground)" : "var(--muted-foreground)",
        }}
      >
        {selected?.label || placeholder}
        <ChevronDown />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-md border shadow-lg"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          {options.map((opt, i) => (
            <button
              key={opt.value}
              className="block w-full whitespace-nowrap border-t px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
              style={{
                borderColor: i === 0 ? "transparent" : "var(--border)",
                color: "var(--foreground)",
              }}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PERIOD_OPTIONS = [
  { label: "All time", value: "" },
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

function periodToParams(period: string): { since: string; until: string } {
  if (!period) return { since: "", until: "" };
  const now = new Date();
  const until = now.toISOString().slice(0, 10);
  let since = "";
  if (period === "today") {
    since = until;
  } else {
    const days = parseInt(period);
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    since = d.toISOString().slice(0, 10);
  }
  return { since, until };
}

function paramsToperiod(since: string, until: string): string {
  if (!since && !until) return "";
  const now = new Date().toISOString().slice(0, 10);
  if (since === now && (!until || until === now)) return "today";
  if (!until || until === now) {
    const diffMs = new Date(now).getTime() - new Date(since).getTime();
    const diffDays = Math.round(diffMs / 86400000);
    if (diffDays === 7) return "7d";
    if (diffDays === 30) return "30d";
    if (diffDays === 90) return "90d";
  }
  return "";
}

export function Filters({ projects }: { projects: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentProject = searchParams.get("project") ?? "";
  const currentSince = searchParams.get("since") ?? "";
  const currentUntil = searchParams.get("until") ?? "";
  const currentPeriod = paramsToperiod(currentSince, currentUntil);

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const projectOptions = [
    { label: "All Projects", value: "" },
    ...projects.map((p) => ({ label: p, value: p })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dropdown
        value={currentProject}
        options={projectOptions}
        placeholder="All Projects"
        onChange={(v) => updateFilters({ project: v })}
      />
      <Dropdown
        value={currentPeriod}
        options={PERIOD_OPTIONS}
        placeholder="All time"
        onChange={(v) => {
          const { since, until } = periodToParams(v);
          updateFilters({ since, until });
        }}
      />
    </div>
  );
}
