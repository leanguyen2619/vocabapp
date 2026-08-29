import { test, expect } from "@playwright/test";

// Credentials come from prisma/seed.ts (HS0001 / QT0001) — see e2e/README.md.
const STUDENT = { email: "an@vocabapp.vn", password: "123456" };
const ADMIN = { email: "admin@vocabapp.vn", password: "admin123" };

async function fillLoginForm(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}

test("wrong password shows an error and stays on /login", async ({ page }) => {
  await fillLoginForm(page, STUDENT.email, "not-the-real-password");

  // Not getByRole("alert") — Next's own route announcer div also carries role="alert" and would
  // make this ambiguous (strict-mode violation), so target the Alert component's own slot instead.
  await expect(page.locator('[data-slot="alert-description"]')).toHaveText("Email hoặc mật khẩu không đúng.");
  await expect(page).toHaveURL(/\/login$/);
});

test("student login lands on the student dashboard", async ({ page }) => {
  await fillLoginForm(page, STUDENT.email, STUDENT.password);

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Chào Nguyễn An, sẵn sàng học chưa?" })).toBeVisible();
});

test("admin login lands on the admin dashboard", async ({ page }) => {
  await fillLoginForm(page, ADMIN.email, ADMIN.password);

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Chào Quản trị viên" })).toBeVisible();
});
