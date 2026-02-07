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
        <span
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
        </span>
        <UserButton size="icon" />
      </header>
      {children}
    </>
  );
}
