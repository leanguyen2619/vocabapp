"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_DEMO_CREDENTIALS, DEMO_CREDENTIALS } from "@/lib/mock-data";
import { loginAction } from "@/lib/actions/auth";

type InvalidField = "id" | "password" | null;

export function LoginForm() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<InvalidField>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInvalidField(null);

    if (!id.trim() || !password) {
      setError("Vui lòng nhập đầy đủ mã đăng nhập và mật khẩu.");
      setInvalidField(!id.trim() ? "id" : "password");
      return;
    }

    setSubmitting(true);
    const result = await loginAction(id, password);
    setSubmitting(false);

    if (result.error !== undefined) {
      setError(result.error);
      setInvalidField("password");
      return;
    }

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
        <Label htmlFor="id">Mã đăng nhập</Label>
        <Input
          id="id"
          autoComplete="username"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="HS0001"
          aria-invalid={invalidField === "id"}
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
        Học sinh demo: {DEMO_CREDENTIALS.id} / {DEMO_CREDENTIALS.password}
        <br />
        Admin demo: {ADMIN_DEMO_CREDENTIALS.id} / {ADMIN_DEMO_CREDENTIALS.password}
      </p>
    </form>
  );
}
