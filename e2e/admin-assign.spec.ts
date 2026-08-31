import { test, expect } from "@playwright/test";

// Requires prisma/seed.ts to have run first — it creates admin QT0001 and the single seeded
// student HS0001 ("Nguyễn An"), so there's exactly one "Giao từ" button on the dashboard.

test("admin can assign randomly-picked vocabulary to a student", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill("admin@vocabapp.vn");
  await page.locator("#password").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "Giao từ", exact: true }).click();

  const dialog = page.getByRole("dialog").filter({ hasText: "Giao từ vựng cho Nguyễn An" });
  await expect(dialog).toBeVisible();

  // No manual word picking any more — enter a count, hit Random, then Assign.
  await dialog.getByRole("spinbutton").fill("1");
  await dialog.getByRole("button", { name: "Random hoàn toàn" }).click();
  await dialog.getByRole("button", { name: "Giao bài (1)" }).click();

  await expect(page.getByText("Đã giao 1 từ vựng cho Nguyễn An.")).toBeVisible();
});
