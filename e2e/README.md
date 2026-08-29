# End-to-end tests

Real-browser tests (Playwright) for the handful of flows worth testing as a whole app, not as
isolated functions — see `src/**/*.test.ts` (`npm test`) for unit tests instead.

These run against a real Postgres database and a real `next start` server, so **never point them
at the real/production `DATABASE_URL`** — they seed and mutate data. Use a disposable database
(a throwaway Neon branch, a local Postgres, or the Postgres service container CI uses).

## Running locally

```bash
# 1. Point DATABASE_URL/DIRECT_URL (in .env) at a disposable database, then:
npx prisma migrate deploy
npx prisma db seed        # creates HS0001 / QT0001 + demo vocab (prisma/seed.ts)
npm run test:e2e:seed     # pins HS0001's daily quiz word + marks warmup complete (e2e/seed-e2e.ts)

# 2. Build once (Playwright's webServer runs `next start`, which needs a build to exist):
npm run build

# 3. Run the tests:
npm run test:e2e
```

Playwright starts its own server on port 3100 (see `playwright.config.ts`) and reuses one already
running on that port outside CI, so you can also just `npm run start -- -p 3100` in a separate
terminal and iterate with `npx playwright test --headed` / `--ui`.

## What's covered

- `login.spec.ts` — wrong password shows an error; student and admin logins land on their
  respective dashboards.
- `student-quiz.spec.ts` — a student answers their pinned daily quiz question end-to-end and
  reaches the results screen.
- `admin-assign.spec.ts` — an admin assigns a vocabulary word to a student and sees the success
  toast.

Login credentials (`an@vocabapp.vn` / `123456` for the student, `admin@vocabapp.vn` / `admin123`
for the admin) come from `prisma/seed.ts`, not from these test files.
