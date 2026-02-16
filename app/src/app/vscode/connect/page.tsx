import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { createApiKey, hashApiKey } from "@/lib/db";
import { VSCodeConnectLogin } from "@/components/vscode-connect-login";

export const dynamic = "force-dynamic";

function isSupportedRedirect(raw: string): boolean {
  try {
    const uri = new URL(raw);
    return uri.protocol === "vscode:" || uri.protocol === "vscode-insiders:";
  } catch {
    return false;
  }
}

function normalizeRedirect(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function withQuery(raw: string, query: Record<string, string>): string {
  const uri = new URL(raw);
  for (const [key, value] of Object.entries(query)) {
    uri.searchParams.set(key, value);
  }
  return uri.toString();
}

function sanitizeKeyName(name: string | undefined): string {
  if (!name) return "VS Code";
  const trimmed = name.trim();
  if (!trimmed) return "VS Code";
  return trimmed.slice(0, 80);
}

export default async function VSCodeConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; name?: string }>;
}) {
  const params = await searchParams;
  const redirectUri = params.redirect ? normalizeRedirect(params.redirect) : undefined;

  if (!redirectUri || !isSupportedRedirect(redirectUri)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Invalid VS Code callback</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Please start the connection from the extension sidebar.
        </p>
      </main>
    );
  }

  const resumePath =
    `/vscode/connect?redirect=${encodeURIComponent(redirectUri)}` +
    (params.name ? `&name=${encodeURIComponent(params.name)}` : "");
  const signInHref = `/auth/sign-in?redirectTo=${encodeURIComponent(resumePath)}`;
  const signUpHref = `/auth/sign-up?redirectTo=${encodeURIComponent(resumePath)}`;

  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Connect VS Code</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Sign in to continue. Once authenticated, you will be redirected here, your API key is created, then sent back to VS Code automatically.
        </p>
        <VSCodeConnectLogin signInHref={signInHref} />
        <div className="mt-4 flex gap-3">
          <Link
            href={signUpHref}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            Create account
          </Link>
        </div>
      </main>
    );
  }

  const raw = `vdt_${crypto.randomUUID().replace(/-/g, "")}`;
  const keyHash = await hashApiKey(raw);
  await createApiKey({
    keyHash,
    userId: session.user.id,
    name: sanitizeKeyName(params.name),
  });

  redirect(withQuery(redirectUri, { apiKey: raw }));
}
