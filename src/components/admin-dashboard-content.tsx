import Link from "next/link";
import {
  BarChart3,
  Building2,
  Clock,
  Library,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Account } from "@/types";

interface AdminFunction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string | null;
}

const adminFunctions: AdminFunction[] = [
  {
    title: "Tài khoản học viên",
    description: "Tạo tài khoản, reset mật khẩu, khóa/mở khóa.",
    icon: Users,
    href: "/admin/accounts",
  },
  {
    title: "Lớp học",
    description: "Tạo lớp, chỉnh số từ mục tiêu mỗi ngày.",
    icon: Building2,
    href: "/admin/classes",
  },
  {
    title: "Từ vựng",
    description: "Thêm/sửa/xóa từ, import từ file Excel.",
    icon: Library,
    href: "/admin/vocabulary",
  },
  {
    title: "Dạng bài tập",
    description: "Thêm dạng bài, chỉnh level mở khóa, bật/tắt.",
    icon: Settings2,
    href: "/admin/exercise-types",
  },
  {
    title: "Question Bank",
    description: "Thêm, chỉnh sửa và duyệt câu hỏi.",
    icon: BarChart3,
    href: "/admin/question-bank",
  },
  {
    title: "Level học viên",
    description: "Unlock A1/A2/B1/B2 thủ công cho học viên.",
    icon: Users,
    href: "/admin/levels",
  },
];

export function AdminDashboardContent({
  account,
  studentCount,
  classCount,
  vocabCount,
}: {
  account: Account;
  studentCount: number;
  classCount: number;
  vocabCount: number;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Chào {account.fullName}
        </h1>
        <p className="text-muted-foreground">Bảng điều khiển quản trị VocabApp.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{studentCount}</p>
              <p className="text-xs text-muted-foreground">Học viên</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{classCount}</p>
              <p className="text-xs text-muted-foreground">Lớp học</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Library className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{vocabCount}</p>
              <p className="text-xs text-muted-foreground">Từ vựng</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">Chức năng quản trị</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminFunctions.map((fn) => {
            const Icon = fn.icon;
            const isReady = Boolean(fn.href);

            const cardBody = (
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{fn.title}</p>
                  <p className="text-sm text-muted-foreground">{fn.description}</p>
                </div>
                {!isReady && (
                  <Badge variant="outline" className="w-fit gap-1 text-muted-foreground">
                    <Clock className="size-3" />
                    Sắp có
                  </Badge>
                )}
              </CardContent>
            );

            if (!isReady) {
              return (
                <Card key={fn.title} className="opacity-60">
                  {cardBody}
                </Card>
              );
            }

            return (
              <Link key={fn.title} href={fn.href!}>
                <Card className="h-full transition-colors hover:border-primary/50">{cardBody}</Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
