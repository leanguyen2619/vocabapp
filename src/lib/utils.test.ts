import { describe, expect, it } from "vitest";

import { cn, getInitials, shuffle } from "./utils";

describe("cn", () => {
  it("merges class lists and lets a later Tailwind class win a conflict", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });
});

describe("shuffle", () => {
  it("returns every original element exactly once, in a new array", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).not.toBe(input);
    expect(result).toHaveLength(input.length);
    expect([...result].sort()).toEqual(input);
  });

  it("doesn't mutate the input array", () => {
    const input = [1, 2, 3];
    const snapshot = [...input];
    shuffle(input);
    expect(input).toEqual(snapshot);
  });
});

describe("getInitials", () => {
  it("takes the first letter of up to the last 2 words, uppercased", () => {
    expect(getInitials("Nguyễn Văn An")).toBe("VA");
    expect(getInitials("Anna")).toBe("A");
  });

  it("collapses repeated whitespace instead of producing an 'undefined' segment", () => {
    expect(getInitials("An   Le")).toBe("AL");
  });

  it("returns an empty string for blank input", () => {
    expect(getInitials("   ")).toBe("");
  });
});
