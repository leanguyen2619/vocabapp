import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function AdminOnlyDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <p className="text-muted-foreground">Chỉ quản trị viên mới có quyền truy cập trang này.</p>
      <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
        Về Dashboard
      </Link>
    </div>
  );
}
