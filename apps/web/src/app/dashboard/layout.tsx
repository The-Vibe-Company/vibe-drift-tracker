import { UserButton } from "@neondatabase/auth/react";
import { SidebarNav } from "@/components/sidebar-nav";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <aside
        className="flex flex-col items-center w-16 shrink-0 border-r py-4"
        style={{
          borderColor: "var(--border)",
          background: "var(--card)",
        }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-10 h-10 mb-6"
          title="VibeDriftTracker"
        >
          <svg
            width="24"
            height="14"
            viewBox="0 0 20 12"
            fill="none"
          >
            <path
              d="M1 6 C4 1, 7 1, 10 6 S16 11, 19 6"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </Link>

        {/* Navigation */}
        <SidebarNav />

        {/* Spacer */}
        <div className="flex-1" />

        {/* User button */}
        <div className="mb-2">
          <UserButton size="icon" />
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
