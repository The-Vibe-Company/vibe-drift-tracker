"use client";

type Props = {
  signInHref: string;
};

export function VSCodeConnectLogin({ signInHref }: Props) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <a
        href={signInHref}
        className="rounded-lg px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        Sign in in browser
      </a>
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        After login, you are redirected back here automatically.
      </span>
    </div>
  );
}
