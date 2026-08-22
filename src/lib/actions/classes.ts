"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";
import type { SchoolClass } from "@/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

export interface ClassWithStudentCount extends SchoolClass {
  studentCount: number;
}

/** No admin gate — any signed-in page (e.g. account creation dropdowns) may read the class list. */
export async function listClassesAction(): Promise<SchoolClass[]> {
  const account = await getCurrentAccount();
  if (!account) return [];
  return prisma.schoolClass.findMany({ orderBy: { className: "asc" } });
}

export async function listClassesWithCountsAction(): Promise<ClassWithStudentCount[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const classes = await prisma.schoolClass.findMany({
    orderBy: { className: "asc" },
    include: { _count: { select: { accounts: { where: { role: "student" } } } } },
  });
  return classes.map((c) => ({
    id: c.id,
    className: c.className,
    dailyWordTarget: c.dailyWordTarget,
    studentCount: c._count.accounts,
  }));
}

export async function createClassAction(
  className: string,
  dailyWordTarget: number
): Promise<{ error: string } | { error?: undefined; id: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };

  const trimmed = className.trim();
  if (!trimmed) return { error: "Vui lòng nhập tên lớp." };
  if (!Number.isInteger(dailyWordTarget) || dailyWordTarget <= 0) {
    return { error: "Số từ mỗi ngày phải là số nguyên dương." };
  }

  const created = await prisma.schoolClass.create({ data: { className: trimmed, dailyWordTarget } });
  return { id: created.id };
}

export async function updateClassTargetAction(id: string, dailyWordTarget: number): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;
  if (!Number.isInteger(dailyWordTarget) || dailyWordTarget < 0) return false;

  const updated = await prisma.schoolClass
    .update({ where: { id }, data: { dailyWordTarget } })
    .catch(() => null);
  return updated !== null;
}

export async function deleteClassAction(id: string): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };

  const memberCount = await prisma.account.count({ where: { classId: id } });
  if (memberCount > 0) {
    return { error: "Không thể xóa lớp vì vẫn còn tài khoản (học sinh/giáo viên) thuộc lớp này." };
  }

  const deleted = await prisma.schoolClass.delete({ where: { id } }).catch(() => null);
  if (!deleted) return { error: "Không tìm thấy lớp này." };
  return {};
}
