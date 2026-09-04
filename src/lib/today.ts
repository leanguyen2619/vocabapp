/**
 * Today's date truncated to UTC midnight. Used everywhere "today" gates a daily reset (daily
 * word picks/assignments, warmup). Must be UTC, not local time: `Date#setHours` truncates using
 * the CALLING PROCESS's own system timezone, and this app's "today" gets computed from several
 * different environments (Vercel serverless functions, local dev, one-off scripts) that don't all
 * share one timezone. Two processes computing "today" for the same real moment but in different
 * zones produce two different Date values — which silently duplicates any row keyed on that date,
 * since the two timestamps don't collide on the (accountId, vocabId, date) unique constraint. This
 * caused the exact bug: the same daily word batch got persisted twice, once at UTC midnight and
 * once at ICT (UTC+7) midnight, for the same student. UTC truncation is deterministic everywhere.
 */
export function startOfUTCDay(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
