import { describe, expect, it } from "vitest";

import { prepareWordFormation } from "./practice-prep";
import type { WordFormationItem } from "@/lib/actions/practice-content";

function item(word: string): WordFormationItem {
  return { id: "q1", vocabId: "v1", word, meanVI: "nghĩa", definition: "def" };
}

describe("prepareWordFormation", () => {
  it("flags space characters so the game can render a visible marker for them", () => {
    const [prepared] = prepareWordFormation([item("ice cream")]);
    const spaceTiles = prepared.tiles.filter((t) => t.isSpace);
    expect(spaceTiles).toHaveLength(1);
    expect(spaceTiles[0].char).toBe(" ");
    // Every other tile is a real letter, not flagged as a space.
    expect(prepared.tiles.filter((t) => !t.isSpace).every((t) => t.char !== " ")).toBe(true);
  });

  it("produces one tile per character, reconstructible back into the original word", () => {
    const [prepared] = prepareWordFormation([item("happy")]);
    expect(prepared.tiles).toHaveLength(5);
    const reconstructed = [...prepared.tiles].sort((a, b) => a.id - b.id).map((t) => t.char).join("");
    expect(reconstructed).toBe("happy");
  });
});
