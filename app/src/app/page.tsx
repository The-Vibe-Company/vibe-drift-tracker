import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import landingImg from "@/assets/landing.png";

export const dynamic = "force-dynamic";

const installSteps = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "Create an account",
    description: "Sign up — it only takes a few seconds.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
    title: "Create an API key",
    description: "Go to Settings and generate your personal API key.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "Install the VS Code extension",
    description: (
      <>
        Install{" "}
        <a
          href="https://marketplace.visualstudio.com/items?itemName=VibeDriftTracker.vibedrift-tracker"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors hover:opacity-80"
          style={{ color: "var(--primary)" }}
        >
          VibeDrift Tracker from the VS Code Marketplace
        </a>
        .
      </>
    ),
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    title: "Set your API key in VS Code",
    description: (
      <>
        Open VS Code settings and paste your key into{" "}
        <code
          className="rounded px-1.5 py-0.5 text-xs font-mono"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          vibedrift.apiKey
        </code>
        .
      </>
    ),
  },
];

const pipelineSteps = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "Install the extension",
    description: "One click in VS Code or Cursor.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Code with Claude",
    description: "Write code, ask questions, iterate. We silently count.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "See your drift live",
    description: "Watch your drift score update in real time as you code.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <line x1="1.05" y1="12" x2="7" y2="12" />
        <line x1="17.01" y1="12" x2="22.96" y2="12" />
      </svg>
    ),
    title: "Commit your work",
    description: "Every git commit saves a snapshot of your session.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 4-8" />
      </svg>
    ),
    title: "Track your history",
    description: "Prompts, lines changed, drift score — commit by commit.",
  },
];

export default async function Home() {
  const { data: session } = await auth.getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* ===== HEADER ===== */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: "var(--border)",
          background: "rgba(10, 10, 10, 0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/" className="flex items-center gap-1.5 text-lg font-semibold tracking-tight" style={{ color: "var(--primary)" }}>
          VibeDriftTracker
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none" style={{ display: "inline-block", opacity: 0.7 }}>
            <path d="M1 6 C4 1, 7 1, 10 6 S16 11, 19 6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" fill="none"  />
          </svg>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/auth/sign-in"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--muted-foreground)" }}
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* ===== HERO ===== */}
      <section
        className="relative px-6 md:px-12 lg:px-24"
        style={{ paddingTop: "14vh", paddingBottom: "8vh" }}
      >
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 20% 40%, rgba(250,204,21,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-3xl">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium tracking-wide mb-8"
            style={{
              color: "var(--primary)",
              background: "rgba(250,204,21,0.08)",
              borderLeft: "3px solid var(--primary)",
            }}
          >
            For vibecoders
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            Stop{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #facc15, #fde68a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              drifting
            </span>
            .<br />
            Ship what you meant&nbsp;to.
          </h1>

          {/* Wave accent */}
          <svg
            className="mt-4"
            width="120"
            height="20"
            viewBox="0 0 120 20"
            fill="none"
            style={{ opacity: 0.7, overflow: "visible" }}
          >
            <path
              d="M0 10 Q15 2, 30 10 T60 10 T90 10 T120 10"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              style={{ animation: "waveFlow 3s ease-in-out infinite" }}
            />
          </svg>

          {/* Subtitle */}
          <p
            className="mt-6 text-base sm:text-lg max-w-xl leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            VibeDriftTracker tracks your Claude Code interactions per commit.
            See when you&apos;re on track — and when you&apos;re losing the plot.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/auth/sign-up"
              className="rounded-md px-6 py-3 text-sm font-semibold transition-colors hover:opacity-90"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              Get Started
            </Link>
            <a
              href="#get-started"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--muted-foreground)" }}
            >
              Get started ↓
            </a>
          </div>
        </div>
      </section>

      {/* ===== GET STARTED ===== */}
      <section id="get-started" className="px-6 py-16" style={{ scrollMarginTop: 80 }}>
        <div className="mx-auto max-w-6xl">
          <p
            className="text-xs font-medium tracking-widest uppercase text-center mb-14"
            style={{ color: "var(--muted-foreground)" }}
          >
            Get started
          </p>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Single continuous line behind all bubbles */}
            <div
              className="hidden lg:block absolute top-6 left-0 right-0"
              style={{ height: 2, background: "var(--border)" }}
            />
            {installSteps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {/* Step number */}
                <span
                  className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                  style={{
                    background: "#1a1805",
                    color: "var(--primary)",
                    border: "1px solid rgba(250,204,21,0.25)",
                  }}
                >
                  {i + 1}
                </span>
                {/* Icon */}
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-md [&>svg]:h-7 [&>svg]:w-7"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {step.icon}
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FLOW PIPELINE ===== */}
      <section id="how-it-works" className="px-6 py-16" style={{ scrollMarginTop: 80 }}>
        <div className="mx-auto max-w-sm">
          {/* Section label */}
          <p
            className="text-xs font-medium tracking-widest uppercase text-center mb-12"
            style={{ color: "var(--muted-foreground)" }}
          >
            How it works
          </p>

          {/* Pipeline — always vertical */}
          <div className="flex flex-col items-center gap-0">
            {pipelineSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center w-full">
                {/* Step card */}
                <div
                  className="rounded-lg p-5 border text-center w-full"
                  style={{
                    borderColor: i === pipelineSteps.length - 1 ? "var(--primary)" : "var(--border)",
                    background: "var(--card)",
                    boxShadow: i === pipelineSteps.length - 1 ? "0 0 30px rgba(250,204,21,0.1)" : "none",
                  }}
                >
                  <div
                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md"
                    style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {step.description}
                  </p>
                </div>

                {/* Vertical connector */}
                {i < pipelineSteps.length - 1 && (
                  <div
                    className="relative"
                    style={{ width: 2, height: 48, background: "var(--border)", overflow: "hidden" }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: -2,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        animation: "flowDotVertical 2s linear infinite",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: -2,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        animation: "flowDotVertical 2s linear infinite 1s",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SCREENSHOT ===== */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          {/* Section label */}
          <p
            className="text-xs font-medium tracking-widest uppercase text-center mb-3"
            style={{ color: "var(--muted-foreground)" }}
          >
            What you&apos;ll see
          </p>
          <p
            className="text-sm text-center mb-12"
            style={{ color: "var(--muted-foreground)" }}
          >
            After every commit, VibeDrift tells you exactly where you stand.
          </p>

          <Image
            src={landingImg}
            alt="VibeDriftTracker dashboard"
            className="rounded-lg border"
            style={{ borderColor: "var(--border)" }}
            priority
          />
        </div>
      </section>

    </div>
  );
}
