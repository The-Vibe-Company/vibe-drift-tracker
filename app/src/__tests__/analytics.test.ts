import { describe, expect, it } from "vitest";
import { isSignupSession, SIGNUP_SESSION_WINDOW_MS } from "@/lib/analytics";

describe("isSignupSession", () => {
  const created = new Date("2026-10-15T12:00:00.000Z");

  it("treats a session created with the user as a signup", () => {
    expect(isSignupSession(created, new Date(created.getTime() + 1_000))).toBe(
      true,
    );
  });

  it("accepts ISO strings", () => {
    expect(
      isSignupSession(created.toISOString(), created.toISOString()),
    ).toBe(true);
  });

  it("rejects a later login session", () => {
    const later = new Date(created.getTime() + SIGNUP_SESSION_WINDOW_MS + 1);
    expect(isSignupSession(created, later)).toBe(false);
  });

  it("rejects missing timestamps", () => {
    expect(isSignupSession(null, created)).toBe(false);
    expect(isSignupSession(created, undefined)).toBe(false);
    expect(isSignupSession("not-a-date", created)).toBe(false);
  });
});
