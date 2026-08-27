import { describe, expect, it } from "vitest";

import { parseWordScope } from "./word-scope";

describe("parseWordScope", () => {
  it("accepts each valid scope value", () => {
    expect(parseWordScope("new")).toBe("new");
    expect(parseWordScope("mixed")).toBe("mixed");
    expect(parseWordScope("old")).toBe("old");
  });

  it("falls back to 'mixed' for undefined, empty, or an unrecognized value", () => {
    expect(parseWordScope(undefined)).toBe("mixed");
    expect(parseWordScope("")).toBe("mixed");
    expect(parseWordScope("bogus")).toBe("mixed");
  });
});
