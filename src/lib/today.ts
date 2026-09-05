/** This app's users are in Vietnam (ICT, UTC+7) — the daily reset should line up with their actual
 * midnight, not an arbitrary one. Vietnam does not observe daylight saving time, so a fixed offset
 * is safe year-round (no DST transitions to account for). */
const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Today's date (in Vietnam's ICT, UTC+7) truncated to that day's midnight, expressed as the
 * equivalent UTC instant. Used everywhere "today" gates a daily reset (daily word picks/
 * assignments, warmup).
 *
 * Deliberately NOT `Date#setHours`/local-timezone truncation: that reads the CALLING PROCESS's own
 * system timezone, and this app's "today" gets computed from several different environments
 * (Vercel serverless functions, local dev, one-off scripts) that don't all share one timezone — two
 * processes computing "today" for the same real moment but in different zones would produce two
 * different Date values, silently duplicating any row keyed on that date (this exact bug happened:
 * the same daily word batch got persisted twice, once at UTC midnight and once at ICT midnight, for
 * the same student).
 *
 * Also deliberately NOT plain UTC-calendar-day truncation (an earlier version of this function):
 * that's equally deterministic, but UTC midnight is 7am in Vietnam — so "today" only advanced at
 * 7am local time instead of real local midnight, meaning a student refreshing right after midnight
 * still saw yesterday's words for another 7 hours. Shifting by the fixed Vietnam offset before
 * truncating keeps the "always the same value regardless of calling process" guarantee while
 * actually matching the calendar day Vietnam-based users are living in.
 */
export function startOfUTCDay(date: Date = new Date()): Date {
  const shifted = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);
  const shiftedMidnightUTC = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  return new Date(shiftedMidnightUTC - VIETNAM_UTC_OFFSET_MS);
}
