import { describe, it, expect } from "vitest";
import {
  computeVibeDriftScore,
  getVibeDriftLevel,
  getVibeDriftColor,
} from "../types";

describe("computeVibeDriftScore", () => {
  it("returns 0 when userPrompts is 0", () => {
    expect(computeVibeDriftScore(0)).toBe(0);
    expect(computeVibeDriftScore(0, 100, 50)).toBe(0);
  });

  it("returns score <= 1.0 when userPrompts is 1 (never penalised)", () => {
    expect(computeVibeDriftScore(1, 0, 0)).toBeLessThanOrEqual(1.0);
    expect(computeVibeDriftScore(1, 100, 100)).toBeLessThanOrEqual(1.0);
    expect(computeVibeDriftScore(1, 5, 0)).toBeLessThanOrEqual(1.0);
  });

  it("returns higher score when many prompts but few lines (spinning)", () => {
    const spinning = computeVibeDriftScore(10, 5, 0);
    const productive = computeVibeDriftScore(10, 500, 100);
    expect(spinning).toBeGreaterThan(productive);
  });

  it("returns lower score when few prompts and many lines (productive)", () => {
    const productive = computeVibeDriftScore(3, 200, 100);
    expect(productive).toBeLessThan(3 * 1.5); // at most P * 1.5
    expect(productive).toBeGreaterThan(0);
  });

  it("clamps factor between 0.7 and 1.5", () => {
    // Very productive: lots of lines per prompt → factor should be 0.7
    const score = computeVibeDriftScore(5, 5000, 5000);
    expect(score).toBeCloseTo(5 * 0.7, 1);

    // Very unproductive: 0 lines per prompt → factor should be 1.5
    const scoreZero = computeVibeDriftScore(5, 0, 0);
    expect(scoreZero).toBeCloseTo(5 * 1.5, 1);
  });

  it("handles 0 lines changed", () => {
    const score = computeVibeDriftScore(3, 0, 0);
    // factor = min(1.5, max(0.7, 1.5 - 0/40)) = 1.5
    expect(score).toBeCloseTo(3 * 1.5, 5);
  });

  it("handles very large numbers", () => {
    const score = computeVibeDriftScore(1000, 100000, 100000);
    expect(score).toBeGreaterThan(0);
    expect(Number.isFinite(score)).toBe(true);
  });

  it("uses default 0 for optional line params", () => {
    expect(computeVibeDriftScore(5)).toBe(computeVibeDriftScore(5, 0, 0));
  });
});

describe("getVibeDriftLevel", () => {
  it("returns 'very-low' for score < 1.2", () => {
    expect(getVibeDriftLevel(0)).toBe("very-low");
    expect(getVibeDriftLevel(1.0)).toBe("very-low");
    expect(getVibeDriftLevel(1.19)).toBe("very-low");
  });

  it("returns 'low' for score >= 1.2 and < 2.5", () => {
    expect(getVibeDriftLevel(1.2)).toBe("low");
    expect(getVibeDriftLevel(2.0)).toBe("low");
    expect(getVibeDriftLevel(2.49)).toBe("low");
  });

  it("returns 'moderate' for score >= 2.5 and < 4", () => {
    expect(getVibeDriftLevel(2.5)).toBe("moderate");
    expect(getVibeDriftLevel(3.0)).toBe("moderate");
    expect(getVibeDriftLevel(3.99)).toBe("moderate");
  });

  it("returns 'high' for score >= 4 and < 7", () => {
    expect(getVibeDriftLevel(4)).toBe("high");
    expect(getVibeDriftLevel(5.5)).toBe("high");
    expect(getVibeDriftLevel(6.99)).toBe("high");
  });

  it("returns 'vibe-drift' for score >= 7", () => {
    expect(getVibeDriftLevel(7)).toBe("vibe-drift");
    expect(getVibeDriftLevel(10)).toBe("vibe-drift");
    expect(getVibeDriftLevel(100)).toBe("vibe-drift");
  });
});

describe("getVibeDriftColor", () => {
  it("returns green for very-low", () => {
    expect(getVibeDriftColor("very-low")).toBe("#22c55e");
  });

  it("returns light green for low", () => {
    expect(getVibeDriftColor("low")).toBe("#4ade80");
  });

  it("returns yellow for moderate", () => {
    expect(getVibeDriftColor("moderate")).toBe("#eab308");
  });

  it("returns orange for high", () => {
    expect(getVibeDriftColor("high")).toBe("#f97316");
  });

  it("returns red for vibe-drift", () => {
    expect(getVibeDriftColor("vibe-drift")).toBe("#ef4444");
  });
});
