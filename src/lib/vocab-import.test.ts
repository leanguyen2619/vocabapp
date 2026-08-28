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
});
