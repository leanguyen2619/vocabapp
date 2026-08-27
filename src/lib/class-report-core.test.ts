import { describe, expect, it } from "vitest";

import { buildWeakWordsReport, computeMinAttempted } from "./class-report-core";

describe("computeMinAttempted", () => {
  it("scales down to the real student count for a small class", () => {
    expect(computeMinAttempted(0)).toBe(1);
    expect(computeMinAttempted(1)).toBe(1);
    expect(computeMinAttempted(2)).toBe(2);
  });

  it("caps at 3 once the class is large enough", () => {
    expect(computeMinAttempted(3)).toBe(3);
    expect(computeMinAttempted(50)).toBe(3);
  });
});

describe("buildWeakWordsReport", () => {
  const vocab = [
    { id: "v1", vocab: "ambitious", meanVI: "có tham vọng", levelName: "A2" },
    { id: "v2", vocab: "happy", meanVI: "hạnh phúc", levelName: "A1" },
  ];

  it("excludes a word below the minimum-attempts bar for the class size", () => {
    // 2 students total -> minAttempted = 2; v1 only has 1 history row.
    const histories = [{ vocabId: "v1", status: "new" as const }];
    expect(buildWeakWordsReport(histories, vocab, 2)).toEqual([]);
  });

  it("would have stayed permanently empty under the old fixed threshold of 3 for a 2-student class", () => {
    const histories = [
      { vocabId: "v1", status: "new" as const },
      { vocabId: "v1", status: "learning" as const },
    ];
    const report = buildWeakWordsReport(histories, vocab, 2);
    expect(report).toHaveLength(1);
    expect(report[0].vocabId).toBe("v1");
  });

  it("computes notMasteredPercent from the non-mastered share, rounded", () => {
    const histories = [
      { vocabId: "v1", status: "new" as const },
      { vocabId: "v1", status: "new" as const },
      { vocabId: "v1", status: "mastered" as const },
    ];
    const [entry] = buildWeakWordsReport(histories, vocab, 3);
    expect(entry).toMatchObject({ attempted: 3, notMasteredCount: 2, notMasteredPercent: 67 });
  });

  it("sorts worst (highest not-mastered %) first", () => {
    const histories = [
      { vocabId: "v1", status: "mastered" as const },
      { vocabId: "v1", status: "new" as const },
      { vocabId: "v2", status: "new" as const },
      { vocabId: "v2", status: "new" as const },
    ];
    const report = buildWeakWordsReport(histories, vocab, 2);
    expect(report.map((r) => r.vocabId)).toEqual(["v2", "v1"]);
  });

  it("skips a history row whose vocabId no longer matches any vocabulary entry", () => {
    const histories = [
      { vocabId: "deleted-word", status: "new" as const },
      { vocabId: "deleted-word", status: "new" as const },
    ];
    expect(buildWeakWordsReport(histories, vocab, 2)).toEqual([]);
  });
});
