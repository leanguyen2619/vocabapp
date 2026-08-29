import { test, expect } from "@playwright/test";

// Requires prisma/seed.ts + e2e/seed-e2e.ts to have run first — the latter pins HS0001's only
// daily word to vocab_101 ("ambitious"), which has a real approved question (q_1) in the seed
// data, so the quiz always shows exactly this one deterministic question.

test("student can answer the daily quiz question and reach the results screen", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill("an@vocabapp.vn");
  await page.locator("#password").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/quiz");
  await expect(page.getByRole("heading", { name: 'Từ nào có nghĩa là "có tham vọng"?' })).toBeVisible();

  await page.getByRole("button", { name: "ambitious", exact: true }).click();
  await expect(page.getByText("Chính xác!")).toBeVisible();

  // Only one word is pinned for the day, so this is the last (and only) question.
  await page.getByRole("button", { name: "Xem kết quả" }).click();

  await expect(page.getByRole("heading", { name: "Hoàn thành bài kiểm tra!" })).toBeVisible();
  await expect(page.getByText("Bạn trả lời đúng 1/1 câu.")).toBeVisible();
});
