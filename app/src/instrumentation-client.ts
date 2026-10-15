import posthog from "posthog-js";

const posthogKey =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  "phc_yNwaHKpvK7NbRgG5RF7RCFnfgUsNKNaetUMm3K3PL5F8";

const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// history_change records the initial view and App Router navigations.
posthog.init(posthogKey, {
  api_host: posthogHost,
  defaults: "2026-01-30",
  capture_pageview: "history_change",
});
