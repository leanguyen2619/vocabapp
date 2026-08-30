import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // VERCEL_ENV is "production"/"preview" on an actual Vercel deployment and unset everywhere
  // else (local dev, `next start` on a dev machine, CI) — this keeps local/test runs (e.g. a
  // scratch-DB smoke test run with NODE_ENV=production) out of the "production" bucket in
  // Sentry, so the dashboard reflects real student traffic only.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "local",
  // Deliberately no session-replay integration — this app handles real student accounts, and
  // recording actual screen activity is a bigger privacy commitment than plain error/performance
  // monitoring warrants here.
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
