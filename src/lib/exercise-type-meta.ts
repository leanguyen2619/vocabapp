import type { PracticeTypeCode } from "@/types";

/**
 * Canonical Vietnamese display name for every practice type. The editable name lives on the
 * PracticeType row (admin "Quản lý dạng bài tập"), but not every code has a row yet — the newer
 * types (listening_comprehension, reading_comprehension, word_transformation, reading_practice)
 * were added by enum-only migrations and are reachable through warmup and direct links without a
 * seeded row. This map is the fallback so a bare enum code never leaks into the UI (e.g. the
 * Question Bank's type filter).
 */
export const EXERCISE_TYPE_LABELS: Record<PracticeTypeCode, string> = {
  multiple_choice: "Trắc nghiệm",
  flashcard: "Thẻ ghi nhớ",
  typing: "Gõ từ",
  listening: "Nghe và gõ từ",
  matching: "Nối từ",
  pos_classification: "Chọn loại từ",
  sentence_writing: "Viết câu",
  synonym_antonym: "Từ đồng nghĩa - trái nghĩa",
  fill_blank: "Điền từ vào chỗ trống",
  word_formation: "Từ ghép",
  listening_comprehension: "Nghe hiểu câu",
  reading_comprehension: "Cloze trắc nghiệm",
  word_transformation: "Dạng từ",
  reading_practice: "Đọc hiểu",
};

/** DB name if the admin set a real one, else the canonical label — never the bare code. */
export function exerciseTypeLabel(code: PracticeTypeCode, dbName?: string | null): string {
  const trimmed = dbName?.trim();
  if (trimmed && trimmed !== code) return trimmed;
  return EXERCISE_TYPE_LABELS[code];
}
