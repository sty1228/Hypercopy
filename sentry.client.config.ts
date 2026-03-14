import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Capture 100% of errors
  // Session replay — capture 1% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    "ResizeObserver loop",
    // Network errors users can't control
    "Network Error",
    "Failed to fetch",
    "Load failed",
    // Privy internal errors
    "privy",
  ],

  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") return null;
    return event;
  },
});