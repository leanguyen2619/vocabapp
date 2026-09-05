import { describe, expect, it } from "vitest";

import { computeStreak, isNextCalendarDay, isSameCalendarDay, nextStatus } from "./progress-core";

describe("nextStatus", () => {
  it("advances new -> learning -> mastered on consecutive correct answers", () => {
    expect(nextStatus("new", true)).toBe("learning");
    expect(nextStatus("learning", true)).toBe("mastered");
  });

  it("caps at mastered — a correct answer can't overflow past the top of the ladder", () => {
    expect(nextStatus("mastered", true)).toBe("mastered");
  });

  it("demotes mastered -> learning -> new on wrong answers", () => {
    expect(nextStatus("mastered", false)).toBe("learning");
    expect(nextStatus("learning", false)).toBe("new");
  });

  it("floors at new — a wrong answer can't underflow past the bottom of the ladder", () => {
    expect(nextStatus("new", false)).toBe("new");
  });
});

// Dates use an explicit "Z" (UTC) suffix throughout, chosen so the comment next to each literal
// states its actual Vietnam (ICT, UTC+7) wall-clock time — isSameCalendarDay/isNextCalendarDay
// compare calendar days in ICT (see startOfUTCDay in src/lib/today.ts), so "same UTC date" is NOT
// the same thing as "same day" here: the ICT day boundary falls at 17:00 UTC, not midnight UTC.
describe("isSameCalendarDay", () => {
  it("is true for two timestamps on the same calendar day, different times", () => {
    // 08:00 ICT Aug 28 vs 23:00 ICT Aug 28 — same Vietnam day.
    expect(isSameCalendarDay(new Date("2026-08-28T01:00:00Z"), new Date("2026-08-28T16:00:00Z"))).toBe(true);
  });

  it("is false across a day boundary even if less than 24h apart", () => {
    // 23:59 ICT Aug 28 vs 00:01 ICT Aug 29 — two minutes apart, but different Vietnam days.
    expect(isSameCalendarDay(new Date("2026-08-28T16:59:00Z"), new Date("2026-08-28T17:01:00Z"))).toBe(false);
  });
});

describe("isNextCalendarDay", () => {
  it("is true for the calendar day right after", () => {
    // 10:00 ICT Aug 28 vs 02:00 ICT Aug 29.
    expect(isNextCalendarDay(new Date("2026-08-28T03:00:00Z"), new Date("2026-08-28T19:00:00Z"))).toBe(true);
  });

  it("is false for the same day", () => {
    // 10:00 ICT Aug 28 vs 20:00 ICT Aug 28.
    expect(isNextCalendarDay(new Date("2026-08-28T03:00:00Z"), new Date("2026-08-28T13:00:00Z"))).toBe(false);
  });

  it("is false for a gap of 2+ days", () => {
    // 10:00 ICT Aug 28 vs 10:00 ICT Aug 30.
    expect(isNextCalendarDay(new Date("2026-08-28T03:00:00Z"), new Date("2026-08-30T03:00:00Z"))).toBe(false);
  });
});

describe("computeStreak", () => {
  it("starts at 1 when there's no prior activity", () => {
    expect(computeStreak(0, null, new Date("2026-08-28T03:00:00Z"))).toBe(1);
  });

  it("stays unchanged (but at least 1) when already counted today", () => {
    // Both 15:00 ICT and 23:00 ICT on Aug 28 — same Vietnam day.
    expect(computeStreak(5, new Date("2026-08-28T08:00:00Z"), new Date("2026-08-28T16:00:00Z"))).toBe(5);
    expect(computeStreak(0, new Date("2026-08-28T08:00:00Z"), new Date("2026-08-28T16:00:00Z"))).toBe(1);
  });

  it("increments by 1 when practicing the day right after the last activity", () => {
    // 15:00 ICT Aug 27 vs 23:00 ICT Aug 28 — one Vietnam day apart.
    expect(computeStreak(5, new Date("2026-08-27T08:00:00Z"), new Date("2026-08-28T16:00:00Z"))).toBe(6);
  });

  it("resets to 1 after any gap of a day or more", () => {
    expect(computeStreak(10, new Date("2026-08-20T08:00:00Z"), new Date("2026-08-28T16:00:00Z"))).toBe(1);
  });
});
