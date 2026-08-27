import { describe, expect, it } from "vitest";

import { formatMessage } from "./format";

describe("formatMessage", () => {
  it("substitutes every placeholder present in params", () => {
    expect(formatMessage("Câu {current}/{total}", { current: 2, total: 5 })).toBe("Câu 2/5");
  });

  it("leaves a placeholder untouched if its key is missing from params", () => {
    expect(formatMessage("Hi {name}", {})).toBe("Hi {name}");
  });

  it("returns the template as-is when no params are given", () => {
    expect(formatMessage("Plain text")).toBe("Plain text");
  });

  it("stringifies numeric values", () => {
    expect(formatMessage("{count} students", { count: 3 })).toBe("3 students");
  });
});
