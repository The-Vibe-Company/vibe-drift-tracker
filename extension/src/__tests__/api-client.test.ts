import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendCommitPayload } from "../api-client";
import type { CommitPayload } from "vibedrift-shared";

const mockPayload: CommitPayload = {
  commitHash: "abc123",
  message: "test commit",
  author: "Test",
  branch: "main",
  committedAt: new Date().toISOString(),
  projectName: "test-project",
  userPrompts: 3,
  aiResponses: 3,
  totalInteractions: 6,
  toolCalls: 2,
  filesChanged: 5,
  linesAdded: 100,
  linesDeleted: 20,
  source: "vscode",
  sessionIds: ["sess-1"],
};

describe("sendCommitPayload", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST request with correct URL and body", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vibeDriftScore: 2.5, vibeDriftLevel: "moderate" }),
    } as Response);

    await sendCommitPayload("https://api.example.com", mockPayload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/commits",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(mockPayload),
      }),
    );
  });

  it("includes Content-Type header", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vibeDriftScore: 1, vibeDriftLevel: "low" }),
    } as Response);

    await sendCommitPayload("https://api.example.com", mockPayload);

    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const headers = (callArgs[1] as RequestInit).headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("includes Authorization header when apiKey is provided", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vibeDriftScore: 1, vibeDriftLevel: "low" }),
    } as Response);

    await sendCommitPayload("https://api.example.com", mockPayload, "my-key");

    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const headers = (callArgs[1] as RequestInit).headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer my-key");
  });

  it("omits Authorization header when no apiKey", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vibeDriftScore: 1, vibeDriftLevel: "low" }),
    } as Response);

    await sendCommitPayload("https://api.example.com", mockPayload);

    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const headers = (callArgs[1] as RequestInit).headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("returns score and level on success", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vibeDriftScore: 3.5, vibeDriftLevel: "moderate" }),
    } as Response);

    const result = await sendCommitPayload("https://api.example.com", mockPayload);

    expect(result.vibeDriftScore).toBe(3.5);
    expect(result.vibeDriftLevel).toBe("moderate");
  });

  it("throws on non-ok response", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(
      sendCommitPayload("https://api.example.com", mockPayload),
    ).rejects.toThrow("API error 500");
  });

  it("throws on network error", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("Network failure"));

    await expect(
      sendCommitPayload("https://api.example.com", mockPayload),
    ).rejects.toThrow("Network failure");
  });
});
