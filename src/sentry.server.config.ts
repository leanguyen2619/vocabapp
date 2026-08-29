import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Sentry DSNs are meant to be shared publicly (they only permit sending events, not reading
  // data), so there's no secrecy concern with the client bundle embedding this value too.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
