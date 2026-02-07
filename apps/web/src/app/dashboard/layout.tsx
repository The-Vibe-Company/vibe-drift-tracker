import Link from "next/link";
import { UserButton } from "@neondatabase/auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: "var(--border)",
          background: "rgba(10, 10, 10, 0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-lg font-semibold tracking-tight"
          style={{ color: "var(--primary)" }}
        >
          VibeDriftTracker
          <svg
            width="20"
            height="12"
            viewBox="0 0 20 12"
            fill="none"
            style={{ display: "inline-block", opacity: 0.7 }}
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
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--muted-foreground)" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Settings
          </Link>
          <UserButton size="icon" />
        </div>
      </header>
      {children}
    </>
  );
}
