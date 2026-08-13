"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { registerAction } from "@/lib/actions/auth";
import type { Role } from "@/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InvalidField = "fullName" | "email" | "password" | "confirmPassword" | null;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>(() =>
    searchParams.get("role") === "teacher" ? "teacher" : "student"
  );
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<InvalidField>(null);
  const [submitting, setSubmitting] = useState(false);

  const fail = (message: string, field: InvalidField) => {
    setError(message);
    setInvalidField(field);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInvalidField(null);

    if (!fullName.trim()) {
      fail("Vui lòng nhập họ và tên.", "fullName");
      return;
    }
    if (!email.trim()) {
      fail("Vui lòng nhập email.", "email");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      fail("Email không đúng định dạng.", "email");
      return;
    }
    if (!password || !confirmPassword) {
      fail("Vui lòng nhập đầy đủ mật khẩu.", !password ? "password" : "confirmPassword");
      return;
    }
    if (password.length < 6) {
      fail("Mật khẩu cần ít nhất 6 ký tự.", "password");
      return;
    }
    if (password !== confirmPassword) {
      fail("Mật khẩu xác nhận không khớp.", "confirmPassword");
      return;
    }

    setSubmitting(true);
    const result = await registerAction({ fullName: fullName.trim(), email: email.trim(), password, role });
    setSubmitting(false);

    if (result.error !== undefined) {
      fail(result.error, "email");
      return;
    }

    toast.success(`Đăng ký thành công! Mã học viên của bạn: ${result.id_login}. Lần sau đăng nhập bằng email nhé.`, {
      duration: 10000,
    });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Họ và tên</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nguyễn Văn A"
          aria-invalid={invalidField === "fullName"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ban@vocabapp.vn"
          aria-invalid={invalidField === "email"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tối thiểu 6 ký tự"
          aria-invalid={invalidField === "password"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu"
          aria-invalid={invalidField === "confirmPassword"}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Bạn là</Label>
        <RadioGroup
          value={role}
          onValueChange={(value) => setRole(value as Role)}
          className="grid-cols-2"
        >
          <Label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 has-data-checked:border-primary">
            <RadioGroupItem value="student" />
            Học sinh
          </Label>
          <Label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 has-data-checked:border-primary">
            <RadioGroupItem value="teacher" />
            Giáo viên
          </Label>
        </RadioGroup>
      </div>

      <Button type="submit" size="lg" className="mt-2 h-10" disabled={submitting}>
        {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
      </Button>
    </form>
  );
}
