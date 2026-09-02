import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

// Mirrors src/lib/mock-data.ts + src/lib/exercise-types.ts — this is the same seed data the
// app has been demoing with, now persisted for real. See prisma/schema.prisma for the shape.

const adapter = new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL }));
const prisma = new PrismaClient({ adapter });

const topics = [
  { id: 1, topic: "Daily Life", definition: "Từ vựng về các hoạt động và tình huống thường ngày." },
  { id: 2, topic: "Family", definition: "Từ vựng về gia đình và các mối quan hệ thân thiết." },
  { id: 3, topic: "Food", definition: "Từ vựng về đồ ăn, thức uống và ẩm thực." },
  { id: 4, topic: "Personality", definition: "Từ vựng mô tả tính cách và đặc điểm con người." },
  { id: 5, topic: "Business", definition: "Từ vựng về công việc, kinh doanh và môi trường công sở." },
  { id: 6, topic: "Environment", definition: "Từ vựng về môi trường và các vấn đề sinh thái." },
  { id: 7, topic: "Technology", definition: "Từ vựng về công nghệ và khoa học kỹ thuật." },
  { id: 8, topic: "Travel", definition: "Từ vựng về du lịch và di chuyển." },
  { id: 9, topic: "Academic", definition: "Từ vựng học thuật dùng trong nghiên cứu và học tập." },
];

const levels = [
  { id: "level_1", level: "A1", maxScore: 100 },
  { id: "level_2", level: "A2", maxScore: 100 },
  { id: "level_3", level: "B1", maxScore: 100 },
  { id: "level_4", level: "B2", maxScore: 100 },
];

const schoolClasses = [{ id: "class_10a1", className: "Lớp 10A1", dailyWordTarget: 5 }];

const vocabularyBank = [
  // A1 — level_1
  { id: "vocab_001", vocab: "happy", definition: "feeling or showing pleasure", meanVI: "hạnh phúc", partOfSpeech: "adjective", levelId: "level_1", topicId: 1 },
  { id: "vocab_002", vocab: "friend", definition: "a person you know and like", meanVI: "bạn bè", partOfSpeech: "noun", levelId: "level_1", topicId: 2 },
  { id: "vocab_003", vocab: "eat", definition: "to put food in your mouth and swallow it", meanVI: "ăn", partOfSpeech: "verb", levelId: "level_1", topicId: 3 },
  { id: "vocab_004", vocab: "house", definition: "a building where people live", meanVI: "ngôi nhà", partOfSpeech: "noun", levelId: "level_1", topicId: 1 },
  { id: "vocab_005", vocab: "quickly", definition: "at a fast speed", meanVI: "nhanh chóng", partOfSpeech: "adverb", levelId: "level_1", topicId: 1 },
  // extra A1 adjectives — needed so the synonym/antonym question pool below has real vocab rows to point at
  { id: "vocab_006", vocab: "big", definition: "of considerable size", meanVI: "to lớn", partOfSpeech: "adjective", levelId: "level_1", topicId: 1 },
  { id: "vocab_007", vocab: "hot", definition: "having a high temperature", meanVI: "nóng", partOfSpeech: "adjective", levelId: "level_1", topicId: 1 },
  { id: "vocab_008", vocab: "easy", definition: "achieved without great effort", meanVI: "dễ", partOfSpeech: "adjective", levelId: "level_1", topicId: 1 },
  { id: "vocab_009", vocab: "fast", definition: "moving or capable of moving at high speed", meanVI: "nhanh", partOfSpeech: "adjective", levelId: "level_1", topicId: 1 },
  { id: "vocab_010", vocab: "book", definition: "a set of printed pages bound together", meanVI: "quyển sách", partOfSpeech: "noun", levelId: "level_1", topicId: 9 },
  { id: "vocab_011", vocab: "water", definition: "a clear liquid needed by all living things", meanVI: "nước", partOfSpeech: "noun", levelId: "level_1", topicId: 3 },
  { id: "vocab_012", vocab: "school", definition: "a place where children go to learn", meanVI: "trường học", partOfSpeech: "noun", levelId: "level_1", topicId: 9 },
  { id: "vocab_013", vocab: "work", definition: "to do a job or task", meanVI: "làm việc", partOfSpeech: "verb", levelId: "level_1", topicId: 5 },
  { id: "vocab_014", vocab: "beautiful", definition: "pleasing to look at", meanVI: "đẹp", partOfSpeech: "adjective", levelId: "level_1", topicId: 4 },
  { id: "vocab_015", vocab: "play", definition: "to take part in a game or fun activity", meanVI: "chơi", partOfSpeech: "verb", levelId: "level_1", topicId: 1 },

  // A2 — level_2
  { id: "vocab_101", vocab: "ambitious", definition: "having a strong desire to achieve success", meanVI: "có tham vọng", partOfSpeech: "adjective", levelId: "level_2", topicId: 4 },
  { id: "vocab_102", vocab: "negotiate", definition: "to discuss something to reach an agreement", meanVI: "đàm phán", partOfSpeech: "verb", levelId: "level_2", topicId: 5 },
  { id: "vocab_103", vocab: "sustainable", definition: "able to continue over a long period without harming the environment", meanVI: "bền vững", partOfSpeech: "adjective", levelId: "level_2", topicId: 6 },
  { id: "vocab_104", vocab: "reluctant", definition: "unwilling and hesitant", meanVI: "miễn cưỡng", partOfSpeech: "adjective", levelId: "level_2", topicId: 4 },
  { id: "vocab_105", vocab: "colleague", definition: "a person you work with", meanVI: "đồng nghiệp", partOfSpeech: "noun", levelId: "level_2", topicId: 5 },
  { id: "vocab_106", vocab: "curious", definition: "eager to know or learn something", meanVI: "tò mò", partOfSpeech: "adjective", levelId: "level_2", topicId: 4 },
  { id: "vocab_107", vocab: "pollution", definition: "harmful substances damaging the environment", meanVI: "ô nhiễm", partOfSpeech: "noun", levelId: "level_2", topicId: 6 },
  { id: "vocab_108", vocab: "traveler", definition: "a person who is traveling or who often travels", meanVI: "du khách", partOfSpeech: "noun", levelId: "level_2", topicId: 8 },
  { id: "vocab_109", vocab: "delicious", definition: "highly pleasant to the taste", meanVI: "ngon", partOfSpeech: "adjective", levelId: "level_2", topicId: 3 },
  { id: "vocab_110", vocab: "confident", definition: "feeling sure about one's own abilities", meanVI: "tự tin", partOfSpeech: "adjective", levelId: "level_2", topicId: 4 },
  { id: "vocab_111", vocab: "schedule", definition: "a plan of activities with the times they will happen", meanVI: "lịch trình", partOfSpeech: "noun", levelId: "level_2", topicId: 5 },
  { id: "vocab_112", vocab: "device", definition: "a piece of equipment made for a particular purpose", meanVI: "thiết bị", partOfSpeech: "noun", levelId: "level_2", topicId: 7 },

  // B1 — level_3
  { id: "vocab_201", vocab: "algorithm", definition: "a set of rules for solving a problem", meanVI: "thuật toán", partOfSpeech: "noun", levelId: "level_3", topicId: 7 },
  { id: "vocab_202", vocab: "itinerary", definition: "a planned route or schedule of a journey", meanVI: "lịch trình", partOfSpeech: "noun", levelId: "level_3", topicId: 8 },
  { id: "vocab_203", vocab: "hypothesis", definition: "an idea that is suggested as an explanation", meanVI: "giả thuyết", partOfSpeech: "noun", levelId: "level_3", topicId: 9 },
  { id: "vocab_204", vocab: "innovative", definition: "introducing new ideas or methods", meanVI: "sáng tạo, đổi mới", partOfSpeech: "adjective", levelId: "level_3", topicId: 7 },
  { id: "vocab_205", vocab: "postpone", definition: "to delay an event to a later time", meanVI: "hoãn lại", partOfSpeech: "verb", levelId: "level_3", topicId: 8 },
  { id: "vocab_206", vocab: "meticulous", definition: "showing great attention to detail", meanVI: "tỉ mỉ, cẩn thận", partOfSpeech: "adjective", levelId: "level_3", topicId: 9 },
  { id: "vocab_207", vocab: "perspective", definition: "a particular way of viewing things", meanVI: "quan điểm", partOfSpeech: "noun", levelId: "level_3", topicId: 9 },
  { id: "vocab_208", vocab: "consequence", definition: "a result of an action or condition", meanVI: "hậu quả", partOfSpeech: "noun", levelId: "level_3", topicId: 9 },
  { id: "vocab_209", vocab: "flexible", definition: "able to change or adapt easily", meanVI: "linh hoạt", partOfSpeech: "adjective", levelId: "level_3", topicId: 5 },
  { id: "vocab_210", vocab: "efficient", definition: "achieving results without wasting time or resources", meanVI: "hiệu quả", partOfSpeech: "adjective", levelId: "level_3", topicId: 5 },
  { id: "vocab_211", vocab: "diverse", definition: "showing a great deal of variety", meanVI: "đa dạng", partOfSpeech: "adjective", levelId: "level_3", topicId: 8 },

  // B2 — level_4
  { id: "vocab_301", vocab: "eloquent", definition: "fluent and persuasive in speaking or writing", meanVI: "hùng biện, lưu loát", partOfSpeech: "adjective", levelId: "level_4", topicId: 9 },
  { id: "vocab_302", vocab: "resilience", definition: "the capacity to recover quickly from difficulties", meanVI: "khả năng phục hồi", partOfSpeech: "noun", levelId: "level_4", topicId: 4 },
  { id: "vocab_303", vocab: "ambiguous", definition: "open to more than one interpretation", meanVI: "mơ hồ, không rõ ràng", partOfSpeech: "adjective", levelId: "level_4", topicId: 9 },
  { id: "vocab_304", vocab: "procrastinate", definition: "to delay or postpone action", meanVI: "trì hoãn", partOfSpeech: "verb", levelId: "level_4", topicId: 1 },
  { id: "vocab_305", vocab: "controversial", definition: "giving rise to public disagreement", meanVI: "gây tranh cãi", partOfSpeech: "adjective", levelId: "level_4", topicId: 5 },
  { id: "vocab_306", vocab: "subsequent", definition: "coming after something in time", meanVI: "sau đó, tiếp theo", partOfSpeech: "adjective", levelId: "level_4", topicId: 9 },
  { id: "vocab_307", vocab: "deteriorate", definition: "to become progressively worse", meanVI: "trở nên tồi tệ hơn", partOfSpeech: "verb", levelId: "level_4", topicId: 6 },
  { id: "vocab_308", vocab: "versatile", definition: "able to adapt to many different functions", meanVI: "đa năng, linh hoạt", partOfSpeech: "adjective", levelId: "level_4", topicId: 7 },
] as const;

const accountLevels = [
  { levelId: "level_1", score: 100, streak: 12, status: "completed" },
  { levelId: "level_2", score: 68, streak: 12, status: "in_progress" },
  { levelId: "level_3", score: 0, streak: 0, status: "locked" },
  { levelId: "level_4", score: 0, streak: 0, status: "locked" },
] as const;

const learningHistory = [
  { vocabId: "vocab_001", status: "mastered", lastDate: "2026-07-20" },
  { vocabId: "vocab_002", status: "mastered", lastDate: "2026-07-20" },
  { vocabId: "vocab_003", status: "mastered", lastDate: "2026-07-19" },
  { vocabId: "vocab_004", status: "mastered", lastDate: "2026-07-19" },
  { vocabId: "vocab_005", status: "mastered", lastDate: "2026-07-18" },
  { vocabId: "vocab_101", status: "mastered", lastDate: "2026-07-21" },
  { vocabId: "vocab_102", status: "learning", lastDate: "2026-07-21" },
  { vocabId: "vocab_103", status: "learning", lastDate: "2026-07-21" },
  { vocabId: "vocab_104", status: "mastered", lastDate: "2026-07-20" },
  { vocabId: "vocab_105", status: "learning", lastDate: "2026-07-20" },
] as const;

const exerciseTypes = [
  { code: "multiple_choice", name: "Trắc nghiệm", description: "Chọn đáp án đúng trong 4 lựa chọn.", level: "level_1" },
  { code: "flashcard", name: "Thẻ ghi nhớ", description: "Lật thẻ để ôn nghĩa từ vựng.", level: "level_1" },
  { code: "matching", name: "Nối từ", description: "Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.", level: "level_1" },
  { code: "pos_classification", name: "Chọn loại từ", description: "Xếp từ vựng vào đúng loại từ (danh từ, động từ, tính từ...).", level: "level_1" },
  { code: "sentence_writing", name: "Viết câu", description: "Đặt câu hoàn chỉnh với từ vựng đã học.", level: "level_1" },
  { code: "synonym_antonym", name: "Từ đồng nghĩa - trái nghĩa", description: "Tìm từ đồng nghĩa hoặc trái nghĩa với từ đã cho.", level: "level_2" },
  { code: "fill_blank", name: "Điền từ vào chỗ trống", description: "Hoàn thành câu bằng từ vựng phù hợp.", level: "level_3" },
  { code: "word_formation", name: "Từ ghép", description: "Ghép các thành phần để tạo thành từ đúng.", level: "level_4" },
  { code: "typing", name: "Gõ từ", description: "Gõ lại từ tiếng Anh dựa trên nghĩa tiếng Việt.", level: "level_1" },
  { code: "listening", name: "Nghe và gõ từ", description: "Nghe phát âm rồi gõ lại từ bạn nghe được.", level: "level_2" },
] as const;

const questionBank = [
  { id: "q_1", vocabId: "vocab_101", questionText: 'Từ nào có nghĩa là "có tham vọng"?', status: "approved", answers: [{ ansText: "ambitious", isCorrect: true }, { ansText: "negotiate", isCorrect: false }, { ansText: "sustainable", isCorrect: false }, { ansText: "reluctant", isCorrect: false }] },
  { id: "q_2", vocabId: "vocab_102", questionText: 'Từ nào có nghĩa là "đàm phán"?', status: "approved", answers: [{ ansText: "negotiate", isCorrect: true }, { ansText: "colleague", isCorrect: false }, { ansText: "curious", isCorrect: false }, { ansText: "pollution", isCorrect: false }] },
  { id: "q_3", vocabId: "vocab_103", questionText: 'Từ nào có nghĩa là "bền vững"?', status: "pending", answers: [{ ansText: "sustainable", isCorrect: true }, { ansText: "reluctant", isCorrect: false }, { ansText: "ambitious", isCorrect: false }, { ansText: "negotiate", isCorrect: false }] },
  { id: "q_4", vocabId: "vocab_201", questionText: 'Từ nào có nghĩa là "thuật toán"?', status: "approved", answers: [{ ansText: "algorithm", isCorrect: true }, { ansText: "itinerary", isCorrect: false }, { ansText: "hypothesis", isCorrect: false }, { ansText: "innovative", isCorrect: false }] },
  { id: "q_5", vocabId: "vocab_202", questionText: 'Từ nào có nghĩa là "lịch trình"?', status: "pending", answers: [{ ansText: "itinerary", isCorrect: true }, { ansText: "postpone", isCorrect: false }, { ansText: "meticulous", isCorrect: false }, { ansText: "algorithm", isCorrect: false }] },
  { id: "q_6", vocabId: "vocab_001", questionText: 'Từ nào có nghĩa là "hạnh phúc"?', status: "approved", answers: [{ ansText: "happy", isCorrect: true }, { ansText: "friend", isCorrect: false }, { ansText: "eat", isCorrect: false }, { ansText: "house", isCorrect: false }] },
  { id: "q_7", vocabId: "vocab_106", questionText: 'Từ nào có nghĩa là "tò mò"?', status: "pending", answers: [{ ansText: "curious", isCorrect: true }, { ansText: "pollution", isCorrect: false }, { ansText: "colleague", isCorrect: false }, { ansText: "negotiate", isCorrect: false }] },
  { id: "q_8", vocabId: "vocab_206", questionText: 'Từ nào có nghĩa là "tỉ mỉ, cẩn thận"?', status: "rejected", answers: [{ ansText: "meticulous", isCorrect: true }, { ansText: "hypothesis", isCorrect: false }, { ansText: "postpone", isCorrect: false }, { ansText: "innovative", isCorrect: false }] },
] as const;

const sentencePrompts = [
  { id: "sw_1", vocabId: "vocab_101", exampleSentence: "She is an ambitious student who always aims for the highest score." },
  { id: "sw_2", vocabId: "vocab_102", exampleSentence: "The two companies negotiated a new contract for months." },
  { id: "sw_3", vocabId: "vocab_103", exampleSentence: "We should use more sustainable energy sources like solar power." },
  { id: "sw_4", vocabId: "vocab_106", exampleSentence: "The curious child kept asking questions about the stars." },
  { id: "sw_5", vocabId: "vocab_105", exampleSentence: "I had lunch with my colleague after the meeting." },
  { id: "sw_6", vocabId: "vocab_204", exampleSentence: "The company is known for its innovative approach to technology." },
] as const;

const synonymAntonymQuestions = [
  { id: "sa_1", vocabId: "vocab_001", relation: "synonym", correctAnswer: "glad", options: ["glad", "sad", "angry", "tired"] },
  { id: "sa_2", vocabId: "vocab_006", relation: "synonym", correctAnswer: "large", options: ["large", "small", "tiny", "short"] },
  { id: "sa_3", vocabId: "vocab_007", relation: "antonym", correctAnswer: "cold", options: ["cold", "warm", "boiling", "mild"] },
  { id: "sa_4", vocabId: "vocab_008", relation: "antonym", correctAnswer: "difficult", options: ["difficult", "simple", "quick", "clear"] },
  { id: "sa_5", vocabId: "vocab_009", relation: "synonym", correctAnswer: "quick", options: ["quick", "slow", "lazy", "late"] },
  { id: "sa_6", vocabId: "vocab_104", relation: "antonym", correctAnswer: "willing", options: ["willing", "hesitant", "unsure", "shy"] },
  { id: "sa_7", vocabId: "vocab_101", relation: "synonym", correctAnswer: "driven", options: ["driven", "lazy", "careless", "calm"] },
  { id: "sa_8", vocabId: "vocab_103", relation: "antonym", correctAnswer: "harmful", options: ["harmful", "renewable", "green", "lasting"] },
] as const;

const fillBlankQuestions = [
  { id: "fb_1", vocabId: "vocab_106", sentence: "She is very ___ about learning new languages.", correctAnswer: "curious", options: ["curious", "reluctant", "sustainable", "ambitious"] },
  { id: "fb_2", vocabId: "vocab_102", sentence: "The manager had to ___ a better deal with the supplier.", correctAnswer: "negotiate", options: ["negotiate", "postpone", "pollute", "assign"] },
  { id: "fb_3", vocabId: "vocab_107", sentence: "We need to protect the environment from ___.", correctAnswer: "pollution", options: ["pollution", "innovation", "algorithm", "itinerary"] },
  { id: "fb_4", vocabId: "vocab_104", sentence: "He was ___ to try the new software at first.", correctAnswer: "reluctant", options: ["reluctant", "curious", "meticulous", "innovative"] },
  { id: "fb_5", vocabId: "vocab_105", sentence: "My ___ helped me finish the project on time.", correctAnswer: "colleague", options: ["colleague", "itinerary", "hypothesis", "pollution"] },
  { id: "fb_6", vocabId: "vocab_203", sentence: "The scientist tested her ___ with an experiment.", correctAnswer: "hypothesis", options: ["hypothesis", "algorithm", "itinerary", "colleague"] },
] as const;

const wordFormationPrompts = [
  { id: "wf_1", vocabId: "vocab_103" },
  { id: "wf_2", vocabId: "vocab_101" },
  { id: "wf_3", vocabId: "vocab_204" },
  { id: "wf_4", vocabId: "vocab_206" },
  { id: "wf_5", vocabId: "vocab_201" },
] as const;

async function main() {
  for (const t of topics) {
    await prisma.topic.upsert({ where: { id: t.id }, update: t, create: t });
  }
  // Topic.id is autoincrement, but the upserts above set it explicitly — Postgres doesn't advance
  // an autoincrement sequence for explicit-id inserts, so without this the sequence stays at 1 and
  // the next *unspecified*-id insert (e.g. ensureTopicsAction, used by the admin's Import Excel
  // flow) collides with an existing row and fails with a unique-constraint error.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Topic"', 'id'), (SELECT MAX(id) FROM "Topic"))`
  );

  for (const l of levels) {
    await prisma.level.upsert({ where: { id: l.id }, update: l, create: l });
  }

  for (const c of schoolClasses) {
    await prisma.schoolClass.upsert({ where: { id: c.id }, update: c, create: c });
  }

  for (const v of vocabularyBank) {
    await prisma.vocabulary.upsert({ where: { id: v.id }, update: v, create: v });
  }

  const studentPasswordHash = await bcrypt.hash("123456", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  await prisma.account.upsert({
    where: { id_login: "HS0001" },
    update: {},
    create: {
      id_login: "HS0001",
      fullName: "Nguyễn An",
      role: "student",
      status: "active",
      classId: "class_10a1",
      email: "an@vocabapp.vn",
      passwordHash: studentPasswordHash,
    },
  });

  await prisma.account.upsert({
    where: { id_login: "QT0001" },
    update: {},
    create: {
      id_login: "QT0001",
      fullName: "Quản trị viên",
      role: "admin",
      status: "active",
      email: "admin@vocabapp.vn",
      passwordHash: adminPasswordHash,
    },
  });

  for (const a of accountLevels) {
    await prisma.accountLevel.upsert({
      where: { accountId_levelId: { accountId: "HS0001", levelId: a.levelId } },
      update: a,
      create: { accountId: "HS0001", ...a },
    });
  }

  for (const h of learningHistory) {
    await prisma.learningHistory.upsert({
      where: { accountId_vocabId: { accountId: "HS0001", vocabId: h.vocabId } },
      update: { status: h.status, lastDate: new Date(h.lastDate) },
      create: { accountId: "HS0001", vocabId: h.vocabId, status: h.status, lastDate: new Date(h.lastDate) },
    });
  }

  const practiceTypeIds: Record<string, string> = {};
  for (const et of exerciseTypes) {
    const row = await prisma.practiceType.upsert({
      where: { type: et.code },
      update: { name: et.name, description: et.description, definition: et.description, levelId: et.level, enabled: true },
      create: { type: et.code, name: et.name, description: et.description, definition: et.description, levelId: et.level, enabled: true },
    });
    practiceTypeIds[et.code] = row.id;
  }

  for (const q of questionBank) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: { questionText: q.questionText, status: q.status, vocabId: q.vocabId, pracTypeId: practiceTypeIds.multiple_choice },
      create: { id: q.id, questionText: q.questionText, status: q.status, vocabId: q.vocabId, pracTypeId: practiceTypeIds.multiple_choice },
    });
    for (const [i, ans] of q.answers.entries()) {
      const ansId = `${q.id}_a${i}`;
      await prisma.answer.upsert({
        where: { questionId_ansId: { questionId: q.id, ansId } },
        update: { ansText: ans.ansText, isCorrect: ans.isCorrect },
        create: { questionId: q.id, ansId, ansText: ans.ansText, isCorrect: ans.isCorrect },
      });
    }
  }

  for (const s of sentencePrompts) {
    await prisma.question.upsert({
      where: { id: s.id },
      update: { questionText: "Đặt một câu hoàn chỉnh với từ này.", explanation: s.exampleSentence, vocabId: s.vocabId, pracTypeId: practiceTypeIds.sentence_writing, status: "approved" },
      create: { id: s.id, questionText: "Đặt một câu hoàn chỉnh với từ này.", explanation: s.exampleSentence, vocabId: s.vocabId, pracTypeId: practiceTypeIds.sentence_writing, status: "approved" },
    });
  }

  for (const s of synonymAntonymQuestions) {
    const questionText =
      s.relation === "synonym" ? "Tìm từ đồng nghĩa với từ này." : "Tìm từ trái nghĩa với từ này.";
    await prisma.question.upsert({
      where: { id: s.id },
      update: { questionText, vocabId: s.vocabId, pracTypeId: practiceTypeIds.synonym_antonym, status: "approved" },
      create: { id: s.id, questionText, vocabId: s.vocabId, pracTypeId: practiceTypeIds.synonym_antonym, status: "approved" },
    });
    for (const [i, optionText] of s.options.entries()) {
      const ansId = `${s.id}_a${i}`;
      const isCorrect = optionText === s.correctAnswer;
      await prisma.answer.upsert({
        where: { questionId_ansId: { questionId: s.id, ansId } },
        update: { ansText: optionText, isCorrect },
        create: { questionId: s.id, ansId, ansText: optionText, isCorrect },
      });
    }
  }

  for (const f of fillBlankQuestions) {
    await prisma.question.upsert({
      where: { id: f.id },
      update: { questionText: f.sentence, vocabId: f.vocabId, pracTypeId: practiceTypeIds.fill_blank, status: "approved" },
      create: { id: f.id, questionText: f.sentence, vocabId: f.vocabId, pracTypeId: practiceTypeIds.fill_blank, status: "approved" },
    });
    for (const [i, optionText] of f.options.entries()) {
      const ansId = `${f.id}_a${i}`;
      const isCorrect = optionText === f.correctAnswer;
      await prisma.answer.upsert({
        where: { questionId_ansId: { questionId: f.id, ansId } },
        update: { ansText: optionText, isCorrect },
        create: { questionId: f.id, ansId, ansText: optionText, isCorrect },
      });
    }
  }

  for (const w of wordFormationPrompts) {
    await prisma.question.upsert({
      where: { id: w.id },
      update: { questionText: "Sắp xếp các chữ cái để tạo thành từ đúng.", vocabId: w.vocabId, pracTypeId: practiceTypeIds.word_formation, status: "approved" },
      create: { id: w.id, questionText: "Sắp xếp các chữ cái để tạo thành từ đúng.", vocabId: w.vocabId, pracTypeId: practiceTypeIds.word_formation, status: "approved" },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
