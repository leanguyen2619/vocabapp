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

describe("isSameCalendarDay", () => {
  it("is true for two timestamps on the same calendar day, different times", () => {
    expect(isSameCalendarDay(new Date("2026-08-28T01:00:00"), new Date("2026-08-28T23:59:00"))).toBe(true);
  });

  it("is false across a day boundary even if less than 24h apart", () => {
    expect(isSameCalendarDay(new Date("2026-08-28T23:59:00"), new Date("2026-08-29T00:01:00"))).toBe(false);
  });
});

describe("isNextCalendarDay", () => {
  it("is true for the calendar day right after", () => {
    expect(isNextCalendarDay(new Date("2026-08-28T10:00:00"), new Date("2026-08-29T02:00:00"))).toBe(true);
  });

  it("is false for the same day", () => {
    expect(isNextCalendarDay(new Date("2026-08-28T10:00:00"), new Date("2026-08-28T20:00:00"))).toBe(false);
  });

  it("is false for a gap of 2+ days", () => {
    expect(isNextCalendarDay(new Date("2026-08-28T10:00:00"), new Date("2026-08-30T10:00:00"))).toBe(false);
  });
});

describe("computeStreak", () => {
  it("starts at 1 when there's no prior activity", () => {
    expect(computeStreak(0, null, new Date("2026-08-28T10:00:00"))).toBe(1);
  });

  it("stays unchanged (but at least 1) when already counted today", () => {
    expect(computeStreak(5, new Date("2026-08-28T08:00:00"), new Date("2026-08-28T18:00:00"))).toBe(5);
    expect(computeStreak(0, new Date("2026-08-28T08:00:00"), new Date("2026-08-28T18:00:00"))).toBe(1);
  });

  it("increments by 1 when practicing the day right after the last activity", () => {
    expect(computeStreak(5, new Date("2026-08-27T08:00:00"), new Date("2026-08-28T18:00:00"))).toBe(6);
  });

  it("resets to 1 after any gap of a day or more", () => {
    expect(computeStreak(10, new Date("2026-08-20T08:00:00"), new Date("2026-08-28T18:00:00"))).toBe(1);
  });
});
