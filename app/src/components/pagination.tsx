"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export function Pagination({
  page,
  pageSize,
  totalItems,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const navigate = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "1" && !(key === "pageSize" && value === "25")) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  function handlePageSizeChange(newSize: number) {
    navigate({ pageSize: String(newSize), page: "" });
  }

  function handlePrev() {
    if (hasPrev) navigate({ page: String(page - 1) });
  }

  function handleNext() {
    if (hasNext) navigate({ page: String(page + 1) });
  }

  return (
    <div
      className="flex items-center justify-end gap-4 border-t px-4 py-3 text-sm"
      style={{
        borderColor: "var(--border)",
        color: "var(--muted-foreground)",
      }}
    >
      {/* Rows per page dropdown */}
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm transition-colors"
            style={{
              borderColor: open ? "var(--primary)" : "var(--border)",
              backgroundColor: "var(--card)",
              color: "var(--foreground)",
            }}
          >
            {pageSize}
            <ChevronDown />
          </button>
          {open && (
            <div
              className="absolute bottom-full right-0 z-50 mb-1 overflow-hidden rounded-md border shadow-lg"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size, i) => (
                <button
                  key={size}
                  className="block w-full whitespace-nowrap border-t px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
                  style={{
                    borderColor: i === 0 ? "transparent" : "var(--border)",
                    color: size === pageSize ? "var(--primary)" : "var(--foreground)",
                  }}
                  onClick={() => {
                    handlePageSizeChange(size);
                    setOpen(false);
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Position indicator */}
      <span>
        {start}–{end} of {totalItems}
      </span>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className="rounded p-1 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: "var(--foreground)" }}
          title="Previous page"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className="rounded p-1 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: "var(--foreground)" }}
          title="Next page"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
