import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

const ROLE_PREFIX: Record<Role, string> = {
  student: "HS",
  admin: "QT",
};

/** Sequential, human-typeable login ID per role, e.g. HS0007. */
export async function generateLoginId(role: Role): Promise<string> {
  const prefix = ROLE_PREFIX[role];
  const count = await prisma.account.count({ where: { role } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}
