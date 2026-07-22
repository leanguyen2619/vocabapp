import Link from "next/link";
import { BookOpen } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
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
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
          <CardDescription>Tiếp tục hành trình học từ vựng của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
