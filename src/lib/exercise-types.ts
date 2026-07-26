import type { PracticeTypeCode } from "@/types";

export interface ExerciseTypeConfig {
  code: PracticeTypeCode;
  name: string;
  description: string;
  level: 1 | 2 | 3 | 4;
  enabled: boolean;
  /** Route to the built exercise, or null if not implemented yet. */
  href: string | null;
}

export const DEFAULT_EXERCISE_TYPES: ExerciseTypeConfig[] = [
  {
    code: "multiple_choice",
    name: "Trắc nghiệm",
    description: "Chọn đáp án đúng trong 4 lựa chọn.",
    level: 1,
    enabled: true,
    href: "/quiz",
  },
  {
    code: "flashcard",
    name: "Thẻ ghi nhớ",
    description: "Lật thẻ để ôn nghĩa từ vựng.",
    level: 1,
    enabled: true,
    href: "/practice",
  },
  {
    code: "matching",
    name: "Nối từ",
    description: "Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.",
    level: 1,
    enabled: true,
    href: "/practice/matching",
  },
  {
    code: "pos_classification",
    name: "Chọn loại từ",
    description: "Xếp từ vựng vào đúng loại từ (danh từ, động từ, tính từ...).",
    level: 1,
    enabled: true,
    href: "/practice/pos",
  },
  {
    code: "sentence_writing",
    name: "Viết câu",
    description: "Đặt câu hoàn chỉnh với từ vựng đã học.",
    level: 1,
    enabled: true,
    href: "/practice/writing",
  },
  {
    code: "synonym_antonym",
    name: "Từ đồng nghĩa - trái nghĩa",
    description: "Tìm từ đồng nghĩa hoặc trái nghĩa với từ đã cho.",
    level: 2,
    enabled: true,
    href: "/practice/synonym-antonym",
  },
  {
    code: "fill_blank",
    name: "Điền từ vào chỗ trống",
    description: "Hoàn thành câu bằng từ vựng phù hợp.",
    level: 3,
    enabled: true,
    href: "/practice/fill-blank",
  },
  {
    code: "word_formation",
    name: "Từ ghép",
    description: "Ghép các thành phần để tạo thành từ đúng.",
    level: 4,
    enabled: true,
    href: "/practice/word-formation",
  },
];

const STORAGE_KEY = "vocabapp_exercise_types";

/** Demo-only persistence — teacher edits live in localStorage, no real backend. */
export function getExerciseTypes(): ExerciseTypeConfig[] {
  if (typeof window === "undefined") return DEFAULT_EXERCISE_TYPES;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_EXERCISE_TYPES;
  try {
    const saved = JSON.parse(raw) as ExerciseTypeConfig[];
    // Merge so newly added default types still show up, and `href` always reflects what's
    // actually implemented in code rather than a stale value from an older saved config.
    return DEFAULT_EXERCISE_TYPES.map((defaultType) => {
      const savedType = saved.find((s) => s.code === defaultType.code);
      return savedType ? { ...savedType, href: defaultType.href } : defaultType;
    });
  } catch {
    return DEFAULT_EXERCISE_TYPES;
  }
}

export function saveExerciseTypes(types: ExerciseTypeConfig[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}
