import { describe, expect, it } from "vitest";

import { cn, expandAcceptedAnswers, getInitials, isAcceptedAnswer, shuffle } from "./utils";

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

describe("expandAcceptedAnswers", () => {
  it("accepts either side of a slash alternative", () => {
    expect(expandAcceptedAnswers("v / versus").sort()).toEqual(["v", "versus"]);
    expect(expandAcceptedAnswers("television / TV").sort()).toEqual(["TV", "television"]);
    expect(expandAcceptedAnswers("maths/mathematics").sort()).toEqual(["mathematics", "maths"]);
  });

  it("makes a parenthetical part optional, with or without a space", () => {
    expect(expandAcceptedAnswers("DVD (player)").sort()).toEqual(["DVD", "DVD player"]);
    expect(expandAcceptedAnswers("exam(ination)").sort()).toEqual(["exam", "examination"]);
    expect(expandAcceptedAnswers("sport(s)").sort()).toEqual(["sport", "sports"]);
    expect(expandAcceptedAnswers("pay (for)").sort()).toEqual(["pay", "pay for"]);
  });

  it("treats square brackets like parentheses", () => {
    expect(expandAcceptedAnswers("gram(me)").sort()).toEqual(["gram", "gramme"]);
  });

  it("combines nested/multiple optional groups with a slash", () => {
    expect(expandAcceptedAnswers("kilo(gram[me])/kg").sort()).toEqual([
      "kg",
      "kilo",
      "kilogram",
      "kilogramme",
    ]);
  });

  it("reconstructs slash alternatives that share a prefix or suffix", () => {
    expect(expandAcceptedAnswers("city / town centre")).toContain("city centre");
    expect(expandAcceptedAnswers("take a photo / picture")).toContain("take a picture");
    expect(expandAcceptedAnswers("quarter (past/to)")).toEqual(
      expect.arrayContaining(["quarter", "quarter past", "quarter to"])
    );
  });

  it("drops an empty alternative from a trailing slash", () => {
    expect(expandAcceptedAnswers("centimetre /")).toEqual(["centimetre"]);
  });

  it("falls back to the raw string when there is nothing to expand", () => {
    expect(expandAcceptedAnswers("running")).toEqual(["running"]);
  });
});

describe("isAcceptedAnswer", () => {
  it("accepts a short form of a parenthetical answer", () => {
    expect(isAcceptedAnswer("dvd", "DVD (player)")).toBe(true);
    expect(isAcceptedAnswer("DVD player", "DVD (player)")).toBe(true);
  });

  it("accepts one listed alternative without the other", () => {
    expect(isAcceptedAnswer("versus", "v / versus")).toBe(true);
    expect(isAcceptedAnswer("v", "v / versus")).toBe(true);
  });

  it("stays case- and accent-insensitive", () => {
    expect(isAcceptedAnswer("CAFE", "cafe / café")).toBe(true);
  });

  it("still rejects a genuinely wrong answer", () => {
    expect(isAcceptedAnswer("cd", "DVD (player)")).toBe(false);
    expect(isAcceptedAnswer("", "v / versus")).toBe(false);
  });
});
