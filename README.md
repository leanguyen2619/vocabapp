# VocabApp

A Vietnamese vocabulary-learning app for schools — students practice via quizzes and games,
teachers assign vocabulary and track class progress, admins manage accounts, classes, and the
question bank. Built with Next.js (App Router), Prisma, and Postgres.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Postgres database (e.g. a free [Neon](https://neon.tech) project) and copy
   `.env.example` to `.env`, filling in `DATABASE_URL` with its connection string.

3. Apply the database schema and seed sample data:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Development notes

- `npx prisma migrate dev --name <name>` to create a new migration after editing
  `prisma/schema.prisma`, followed by `npx prisma generate`. Restart the dev server afterward —
  it holds a Prisma Client instance in memory that won't pick up schema changes on its own.
- `npm run lint` / `npx tsc --noEmit` / `npm run build` before committing.

## Deploying

Set `DATABASE_URL` as an environment variable on the hosting platform, run
`npx prisma migrate deploy` against the production database, then build and start the app
(`npm run build && npm run start`, or the platform's equivalent).
