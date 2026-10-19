/** A session created this close to the user row is that account's signup. */
export const SIGNUP_SESSION_WINDOW_MS = 5 * 60 * 1000;

/**
 * The first Neon Auth session is created with the user. Later logins get a
 * new session whose createdAt is far from the account's createdAt.
 */
export function isSignupSession(
  userCreatedAt: Date | string | number | null | undefined,
  sessionCreatedAt: Date | string | number | null | undefined,
  windowMs = SIGNUP_SESSION_WINDOW_MS,
): boolean {
  if (userCreatedAt == null || sessionCreatedAt == null) return false;
  const userCreated = new Date(userCreatedAt).getTime();
  const sessionCreated = new Date(sessionCreatedAt).getTime();
  if (!Number.isFinite(userCreated) || !Number.isFinite(sessionCreated)) {
    return false;
  }
  return Math.abs(sessionCreated - userCreated) <= windowMs;
}
