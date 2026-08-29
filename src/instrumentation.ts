import * as Sentry from "@sentry/nextjs";

/** Runs once when a new server instance starts — loads the runtime-appropriate Sentry init
 * (Node vs Edge) before the server accepts requests. See sentry.server.config.ts/
 * sentry.edge.config.ts. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** Reports server-side errors (Server Components, Route Handlers, Server Actions) to Sentry —
 * the client-side equivalent is instrumentation-client.ts + the Sentry.captureException calls in
 * error.tsx/global-error.tsx. */
export const onRequestError = Sentry.captureRequestError;
