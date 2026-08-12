import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7's "prisma-client" generator requires a driver adapter (no more
// implicit connection via the schema's `datasource url`).
const adapter = new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL }));

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
