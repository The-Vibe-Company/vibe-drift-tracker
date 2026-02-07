import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-4xl font-bold tracking-tight">VibeDrift</h1>
      <p style={{ color: "var(--muted-foreground)" }}>
        Track your AI-assisted development vibe drift
      </p>
      <div className="flex gap-3">
        <Link
          href="/auth/sign-in"
          className="rounded-md px-4 py-2 text-sm font-medium"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-md px-4 py-2 text-sm font-medium border"
          style={{ borderColor: "var(--border)" }}
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
