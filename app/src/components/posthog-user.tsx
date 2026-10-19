"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth/client";
import { isSignupSession } from "@/lib/analytics";

const capturedSignupIds = new Set<string>();

function signupStorageKey(userId: string) {
  return `vibedrift:signed_up:${userId}`;
}

function hasCapturedSignup(userId: string) {
  if (capturedSignupIds.has(userId)) return true;
  try {
    return localStorage.getItem(signupStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

function markCapturedSignup(userId: string) {
  capturedSignupIds.add(userId);
  try {
    localStorage.setItem(signupStorageKey(userId), "1");
  } catch {
    // The in-memory set still dedupes this page lifetime.
  }
}

/**
 * Identifies the Neon Auth user once a session exists, and captures
 * `signed_up` when that session is the account's first one.
 */
export function PostHogUser() {
  const { data, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    const user = data?.user;
    const session = data?.session;
    if (!user || !session) {
      if (posthog._isIdentified()) posthog.reset();
      return;
    }

    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
    });

    if (
      isSignupSession(user.createdAt, session.createdAt) &&
      !hasCapturedSignup(user.id)
    ) {
      markCapturedSignup(user.id);
      posthog.capture("signed_up");
    }
  }, [data, isPending]);

  return null;
}
