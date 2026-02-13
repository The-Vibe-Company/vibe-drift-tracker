import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the route
vi.mock("@/lib/db", () => ({
  insertCommit: vi.fn(),
  getCommits: vi.fn(),
  hashApiKey: vi.fn(),
  lookupApiKey: vi.fn(),
  updateApiKeyLastUsed: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/auth/server", () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

import { POST, GET } from "@/app/api/commits/route";
import { insertCommit, getCommits, hashApiKey, lookupApiKey } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import type { CommitPayload } from "vibedrift-shared";

function makeRequest(
  body: Partial<CommitPayload>,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/commits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/commits");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const request = new Request(url.toString(), { method: "GET" });
  // Add nextUrl property to mimic NextRequest
  (request as any).nextUrl = url;
  return request;
}

const validPayload: CommitPayload = {
  commitHash: "abc123",
  message: "feat: add login",
  author: "Test User",
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
  prompts: [
    { text: "Add login button", timestamp: "2024-01-01T10:00:00Z", sessionId: "sess-1" },
    { text: "Fix the styles", timestamp: "2024-01-01T10:05:00Z", sessionId: "sess-1" },
    { text: "Add validation", timestamp: "2024-01-01T10:10:00Z", sessionId: "sess-1" },
  ],
};

describe("POST /api/commits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no auth is provided", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({ data: null } as any);

    const request = makeRequest(validPayload) as any;
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when commitHash is missing", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      data: { session: {}, user: { id: "user-1" } },
    } as any);

    const request = makeRequest({
      ...validPayload,
      commitHash: "",
    }) as any;
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("commitHash");
  });

  it("returns 400 for live source", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      data: { session: {}, user: { id: "user-1" } },
    } as any);

    const request = makeRequest({
      ...validPayload,
      source: "live",
    }) as any;
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Live");
  });

  it("inserts commit and returns score/level on valid POST", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      data: { session: {}, user: { id: "user-1" } },
    } as any);

    vi.mocked(insertCommit).mockResolvedValue({
      id: 1,
      commitHash: "abc123",
    } as any);

    const request = makeRequest(validPayload) as any;
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.vibeDriftScore).toBeDefined();
    expect(body.vibeDriftLevel).toBeDefined();
    expect(typeof body.vibeDriftScore).toBe("number");
    expect(insertCommit).toHaveBeenCalledOnce();
  });

  it("authenticates via Bearer token", async () => {
    vi.mocked(hashApiKey).mockResolvedValue("hashed-key");
    vi.mocked(lookupApiKey).mockResolvedValue({
      id: 1,
      userId: "user-2",
      keyHash: "hashed-key",
      name: "test",
      createdAt: new Date(),
      lastUsedAt: null,
    } as any);
    vi.mocked(insertCommit).mockResolvedValue({
      id: 1,
      commitHash: "abc123",
    } as any);

    const request = makeRequest(validPayload, {
      Authorization: "Bearer my-api-key",
    }) as any;
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(hashApiKey).toHaveBeenCalledWith("my-api-key");
    expect(lookupApiKey).toHaveBeenCalledWith("hashed-key");
  });

  it("filters system-generated prompts", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      data: { session: {}, user: { id: "user-1" } },
    } as any);
    vi.mocked(insertCommit).mockResolvedValue({
      id: 1,
      commitHash: "abc123",
    } as any);

    const payloadWithSystemPrompts: CommitPayload = {
      ...validPayload,
      prompts: [
        {
          text: "Real prompt",
          timestamp: "2024-01-01T10:00:00Z",
          sessionId: "sess-1",
        },
        {
          text: "[Request interrupted by user]",
          timestamp: "2024-01-01T10:01:00Z",
          sessionId: "sess-1",
        },
        {
          text: "Implement the following plan: something",
          timestamp: "2024-01-01T10:02:00Z",
          sessionId: "sess-1",
        },
        {
          text: "<task-notification>notify</task-notification>",
          timestamp: "2024-01-01T10:03:00Z",
          sessionId: "sess-1",
        },
      ],
    };

    const request = makeRequest(payloadWithSystemPrompts) as any;
    await POST(request);

    const insertCall = vi.mocked(insertCommit).mock.calls[0][0];
    expect(insertCall.userPrompts).toBe(1);
    expect((insertCall.prompts as any[]).length).toBe(1);
    expect((insertCall.prompts as any[])[0].text).toBe("Real prompt");
  });

  it("returns 409 on duplicate commit", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      data: { session: {}, user: { id: "user-1" } },
    } as any);
    vi.mocked(insertCommit).mockRejectedValue(
      new Error("unique constraint violation: duplicate key"),
    );

    const request = makeRequest(validPayload) as any;
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("already exists");
  });
});

describe("GET /api/commits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({ data: null } as any);

    const request = makeGetRequest() as any;
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns commits for authenticated user", async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      data: { session: {}, user: { id: "user-1" } },
    } as any);
    vi.mocked(getCommits).mockResolvedValue([
      { id: 1, commitHash: "abc", projectName: "test" },
    ] as any);

    const request = makeGetRequest({ project: "test" }) as any;
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(getCommits).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        project: "test",
      }),
    );
  });
});
