"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_CREDENTIALS } from "@/lib/mock-data";
import { login } from "@/lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InvalidField = "email" | "password" | null;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<InvalidField>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInvalidField(null);

    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      setInvalidField(!email.trim() ? "email" : "password");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Email không đúng định dạng.");
      setInvalidField("email");
      return;
    }

    setSubmitting(true);
    const account = login(email, password);
    setSubmitting(false);

    if (!account) {
      setError("Email hoặc mật khẩu không đúng.");
      setInvalidField("password");
      return;
    }

    router.push("/dashboard");
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
          aria-invalid={invalidField === "password"}
        />
      </div>

      <Button type="submit" size="lg" className="mt-2 h-10" disabled={submitting}>
        {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Tài khoản demo: {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
      </p>
    </form>
  );
}
