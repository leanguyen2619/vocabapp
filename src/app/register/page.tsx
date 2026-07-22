import Link from "next/link";
import { BookOpen } from "lucide-react";

import { RegisterForm } from "@/components/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-background px-6 py-16">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="size-4" />
        </div>
        <span className="font-heading text-lg font-semibold">VocabApp</span>
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Tạo tài khoản</CardTitle>
          <CardDescription>Bắt đầu học từ vựng miễn phí ngay hôm nay.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
