import { describe, expect, it } from "vitest";

import { normalizeImportRow, normalizePartOfSpeech } from "./vocab-import";

describe("normalizeImportRow", () => {
  it("maps the app's own export template headers", () => {
    const row = normalizeImportRow({
      vocab: "camera",
      definition: "a device used for taking photographs",
      meanVI: "máy ảnh",
      partOfSpeech: "noun",
      ipa: "/kˈæmɝʌ/",
      topic: "Appliances",
      level: "A2",
    });
    expect(row).toEqual({
      vocab: "camera",
      definition: "a device used for taking photographs",
      meanVI: "máy ảnh",
      partOfSpeech: "noun",
      ipa: "/kˈæmɝʌ/",
      topic: "Appliances",
      level: "A2",
    });
  });

  it("maps the Cambridge-style enriched format's alternate headers", () => {
    const row = normalizeImportRow({
      VocabID: "A2-0001",
      vocab: "camera",
      rawLabel: "camera",
      IPA: "/kˈæmɝʌ/",
      partOfSpeech: "noun",
      CEFR: "A2",
      meaningVI: "máy ảnh",
      definitionEN: "a device used for taking photographs",
      exampleEN: "I learned the word 'camera' today.",
      exampleVI: "Tôi đã học từ 'camera' hôm nay.",
      primaryTopic: "Appliances",
      additionalTopics: "Communication and Technology",
    });
    expect(row).toEqual({
      vocab: "camera",
      ipa: "/kˈæmɝʌ/",
      partOfSpeech: "noun",
      level: "A2",
      meanVI: "máy ảnh",
      definition: "a device used for taking photographs",
      topic: "Appliances",
    });
  });

  it("is case-insensitive and trims stray whitespace around headers", () => {
    const row = normalizeImportRow({ " Vocab ": "example", PARTOFSPEECH: "noun" });
    expect(row.vocab).toBe("example");
    expect(row.partOfSpeech).toBe("noun");
  });

  it("prefers the canonical header over an alias when both are present", () => {
    const row = normalizeImportRow({ meanVI: "canonical", meaningVI: "alias" });
    expect(row.meanVI).toBe("canonical");
  });

  it("leaves a field undefined when no alias matches", () => {
    const row = normalizeImportRow({ vocab: "example" });
    expect(row.definition).toBeUndefined();
    expect(row.ipa).toBeUndefined();
  });
});

describe("normalizePartOfSpeech", () => {
  it("accepts a plain single value", () => {
    expect(normalizePartOfSpeech("noun")).toBe("noun");
    expect(normalizePartOfSpeech("Adjective")).toBe("adjective");
  });

  it("takes the first token of a compound value", () => {
    expect(normalizePartOfSpeech("noun; verb")).toBe("noun");
    expect(normalizePartOfSpeech("adverb; adjective")).toBe("adverb");
  });

  it("returns null for an unrecognized value instead of guessing", () => {
    expect(normalizePartOfSpeech("gibberish")).toBeNull();
    expect(normalizePartOfSpeech(undefined)).toBeNull();
    expect(normalizePartOfSpeech("")).toBeNull();
  });

  // Real tag variants seen in a Cambridge-style B1 vocabulary file — previously all of these
  // returned null and silently skipped the row.
  it("maps single-word compound tags via the noun/verb/adjective/etc. they name", () => {
    expect(normalizePartOfSpeech("noun phrase")).toBe("noun");
    expect(normalizePartOfSpeech("verb phrase")).toBe("verb");
    expect(normalizePartOfSpeech("adjective phrase")).toBe("adjective");
    expect(normalizePartOfSpeech("prepositional phrase")).toBe("preposition");
    expect(normalizePartOfSpeech("phrasal verb")).toBe("verb");
    expect(normalizePartOfSpeech("plural noun")).toBe("noun");
    expect(normalizePartOfSpeech("prep phr")).toBe("preposition");
  });

  it("resolves abbreviated dual-type tags by picking whichever type is listed first", () => {
    expect(normalizePartOfSpeech("n & v")).toBe("noun");
    expect(normalizePartOfSpeech("v & n")).toBe("verb");
    expect(normalizePartOfSpeech("adj & n")).toBe("adjective");
    expect(normalizePartOfSpeech("n & adj")).toBe("noun");
    expect(normalizePartOfSpeech("adj & adv")).toBe("adjective");
    expect(normalizePartOfSpeech("adj & exclam")).toBe("adjective");
    expect(normalizePartOfSpeech("adj & v & n")).toBe("adjective");
    expect(normalizePartOfSpeech("noun/adjective")).toBe("noun");
    expect(normalizePartOfSpeech("verb/noun")).toBe("verb");
    expect(normalizePartOfSpeech("noun/verb")).toBe("noun");
  });

  it("still returns null for a bare 'phrase' tag with no type signal to go on", () => {
    expect(normalizePartOfSpeech("phrase")).toBeNull();
  });

  it("doesn't false-positive on a POS word that merely contains another one as a substring", () => {
    // "adverb" contains "verb"; "pronoun" contains "noun" — a plain substring check would
    // misclassify both.
    expect(normalizePartOfSpeech("adverb")).toBe("adverb");
    expect(normalizePartOfSpeech("pronoun")).toBe("pronoun");
    expect(normalizePartOfSpeech("adverb; adjective")).toBe("adverb");
    expect(normalizePartOfSpeech("pronoun & adjective")).toBe("pronoun");
  });

  // Real tag variants seen in A1 and B2 Cambridge-style vocabulary files.
  it("maps grammatical categories outside the 8-value enum to their closest fit", () => {
    expect(normalizePartOfSpeech("idiom")).toBe("verb");
    expect(normalizePartOfSpeech("determiner")).toBe("adjective");
    expect(normalizePartOfSpeech("discourse marker")).toBe("adverb");
    expect(normalizePartOfSpeech("interrogative")).toBe("pronoun");
    expect(normalizePartOfSpeech("possessive")).toBe("pronoun");
    expect(normalizePartOfSpeech("exclamation")).toBe("interjection");
    expect(normalizePartOfSpeech("uncountable noun")).toBe("noun");
  });

  it("splits on '+' the same way as the other separators, preserving first-mentioned-wins", () => {
    expect(normalizePartOfSpeech("noun + verb")).toBe("noun");
    expect(normalizePartOfSpeech("adjective + noun")).toBe("adjective");
    expect(normalizePartOfSpeech("noun + adjective")).toBe("noun");
    expect(normalizePartOfSpeech("determiner + pronoun")).toBe("adjective");
    expect(normalizePartOfSpeech("adverb + interrogative")).toBe("adverb");
    expect(normalizePartOfSpeech("interrogative + adverb")).toBe("pronoun");
  });
});
