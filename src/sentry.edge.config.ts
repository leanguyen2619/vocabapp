import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // VERCEL_ENV is "production"/"preview" on an actual Vercel deployment and unset everywhere
  // else (local dev, `next start` on a dev machine, CI) — see instrumentation-client.ts for why.
  environment: process.env.VERCEL_ENV ?? "local",
});
