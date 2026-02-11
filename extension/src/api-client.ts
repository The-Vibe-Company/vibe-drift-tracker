import type { CommitPayload } from "vibedrift-shared";

export async function sendCommitPayload(
  apiUrl: string,
  payload: CommitPayload,
  apiKey?: string,
): Promise<{ vibeDriftScore: number; vibeDriftLevel: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${apiUrl}/api/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status} from ${apiUrl}`);
  }

  return response.json();
}
