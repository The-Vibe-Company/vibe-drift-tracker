import { AuthView } from "@neondatabase/auth/react";
import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ path: "sign-in" }, { path: "sign-up" }, { path: "sign-out" }];
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(250,204,21,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-2">
        <Link
          href="/"
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
        <span
          className="text-xs font-medium tracking-wide"
          style={{ color: "var(--muted-foreground)" }}
        >
          For vibecoders
        </span>
      </div>

      {/* Auth form */}
      <div className="relative z-10 w-full" style={{ maxWidth: 440 }}>
        <AuthView path={path} />
      </div>
    </main>
  );
}
