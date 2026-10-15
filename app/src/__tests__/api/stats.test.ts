import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  getAccountStats: vi.fn(),
}));

import { GET } from "@/app/api/stats/route";
import { getAccountStats } from "@/lib/db";

const stats = {
  total_users: 10,
  new_users_1d: 1,
  new_users_7d: 4,
  active_users_1d: 3,
  active_users_7d: null,
};

function call(headers: Record<string, string> = {}) {
  return GET(
    new Request("http://localhost/api/stats", {
      method: "GET",
      headers,
    }),
  );
}

describe("GET /api/stats", () => {
  const previous = process.env.STATS_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STATS_TOKEN = "test-token";
    vi.mocked(getAccountStats).mockResolvedValue(stats);
  });

  afterEach(() => {
    process.env.STATS_TOKEN = previous;
  });

  it("returns 401 when the bearer token is missing", async () => {
    const response = await call();
    expect(response.status).toBe(401);
    expect(getAccountStats).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer token is wrong", async () => {
    const response = await call({ authorization: "Bearer other-token" });
    expect(response.status).toBe(401);
    expect(getAccountStats).not.toHaveBeenCalled();
  });

  it("returns 401 when STATS_TOKEN is unset", async () => {
    delete process.env.STATS_TOKEN;
    const response = await call({ authorization: "Bearer test-token" });
    expect(response.status).toBe(401);
    expect(getAccountStats).not.toHaveBeenCalled();
  });

  it("returns account stats for a valid bearer token", async () => {
    const response = await call({ authorization: "Bearer test-token" });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(stats);
  });

  it("accepts a lowercase bearer scheme", async () => {
    const response = await call({ authorization: "bearer test-token" });
    expect(response.status).toBe(200);
  });

  it("returns 500 when stats cannot be loaded", async () => {
    vi.mocked(getAccountStats).mockRejectedValue(new Error("db down"));
    const response = await call({ authorization: "Bearer test-token" });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to load stats" });
  });
});
