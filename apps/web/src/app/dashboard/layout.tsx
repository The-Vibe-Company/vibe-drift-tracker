import { UserButton } from "@neondatabase/auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-sm font-semibold tracking-tight">VibeDrift</span>
        <UserButton size="icon" />
      </header>
      {children}
    </>
  );
}
