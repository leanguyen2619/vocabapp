import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Deliberately no session-replay integration — this app handles real student accounts, and
  // recording actual screen activity is a bigger privacy commitment than plain error/performance
  // monitoring warrants here.
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
