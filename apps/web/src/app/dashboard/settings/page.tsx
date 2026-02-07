import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getApiKeysByUser } from "@/lib/db";
import { ApiKeyManager } from "@/components/api-key-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/");

  const keys = await getApiKeysByUser(session.user.id);

  // Serialize dates for client component
  const serializedKeys = keys.map((k) => ({
    ...k,
    createdAt: k.createdAt?.toISOString() ?? null,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Manage your API keys for the VS Code extension and other integrations.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">API Keys</h2>
        <ApiKeyManager initialKeys={serializedKeys} />
      </section>
    </main>
  );
}
