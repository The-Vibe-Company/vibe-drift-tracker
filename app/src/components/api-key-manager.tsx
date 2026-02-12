"use client";

import { useState } from "react";

type ApiKey = {
  id: number;
  name: string;
  createdAt: string | null;
  lastUsedAt: string | null;
};

export function ApiKeyManager({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewKey(data.key);
      setKeys((prev) => [
        { id: data.id, name: data.name, createdAt: new Date().toISOString(), lastUsedAt: null },
        ...prev,
      ]);
      setName("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate key");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this API key? Any extension using it will stop working.")) return;

    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      alert("Failed to delete API key");
    }
  }

  function handleCopy() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Generate form */}
      <form onSubmit={handleGenerate} className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Key name (e.g. "My MacBook")'
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
            color: "var(--foreground)",
          }}
        />
        <button
          type="submit"
          disabled={!name.trim() || loading}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            opacity: !name.trim() || loading ? 0.5 : 1,
            cursor: !name.trim() || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate API Key"}
        </button>
      </form>

      {/* New key banner */}
      {newKey && (
        <div
          className="rounded-lg border p-4"
          style={{
            borderColor: "#ca8a04",
            backgroundColor: "rgba(202, 138, 4, 0.1)",
          }}
        >
          <p className="mb-2 text-sm font-medium" style={{ color: "#facc15" }}>
            Save this API key — it won&apos;t be shown again
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded px-3 py-2 font-mono text-sm"
              style={{
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
              }}
            >
              {newKey}
            </code>
            <button
              onClick={handleCopy}
              className="rounded-lg border px-3 py-2 text-sm transition-colors hover:opacity-80"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p
            className="mt-2 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            Paste this key in your VS Code settings: <code>vibedrift.apiKey</code>
          </p>
        </div>
      )}

      {/* Keys table */}
      {keys.length > 0 ? (
        <div
          className="overflow-x-auto rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--muted)",
                }}
              >
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Last used</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr
                  key={key.id}
                  className="border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-3">{key.name}</td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {key.createdAt
                      ? new Date(key.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="rounded px-2 py-1 text-xs transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            borderColor: "var(--border)",
            color: "var(--muted-foreground)",
          }}
        >
          No API keys yet. Generate one to connect your VS Code extension.
        </div>
      )}
    </div>
  );
}
