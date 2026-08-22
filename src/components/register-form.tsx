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
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Role } from "@/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InvalidField = "fullName" | "email" | "password" | "confirmPassword" | null;

export function RegisterForm({ dict }: { dict: Dictionary }) {
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
      fail(dict.register.errorFullName, "fullName");
      return;
    }
    if (!email.trim()) {
      fail(dict.register.errorEmail, "email");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      fail(dict.register.errorEmailFormat, "email");
      return;
    }
    if (!password || !confirmPassword) {
      fail(dict.register.errorPasswordRequired, !password ? "password" : "confirmPassword");
      return;
    }
    if (password.length < 6) {
      fail(dict.register.errorPasswordLength, "password");
      return;
    }
    if (password !== confirmPassword) {
      fail(dict.register.errorPasswordMismatch, "confirmPassword");
      return;
    }

    setSubmitting(true);
    const result = await registerAction({ fullName: fullName.trim(), email: email.trim(), password, role });
    setSubmitting(false);

    if (result.error !== undefined) {
      fail(result.error, "email");
      return;
    }

    toast.success(formatMessage(dict.register.successToast, { id: result.id_login }), {
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
        <Label htmlFor="fullName">{dict.register.fullNameLabel}</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={dict.register.fullNamePlaceholder}
          aria-invalid={invalidField === "fullName"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{dict.register.emailLabel}</Label>
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
        <Label htmlFor="password">{dict.register.passwordLabel}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={dict.register.passwordPlaceholder}
          aria-invalid={invalidField === "password"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">{dict.register.confirmPasswordLabel}</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={dict.register.confirmPasswordPlaceholder}
          aria-invalid={invalidField === "confirmPassword"}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{dict.register.roleLabel}</Label>
        <RadioGroup
          value={role}
          onValueChange={(value) => setRole(value as Role)}
          className="grid-cols-2"
        >
          <Label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 has-data-checked:border-primary">
            <RadioGroupItem value="student" />
            {dict.register.roleStudent}
          </Label>
          <Label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 has-data-checked:border-primary">
            <RadioGroupItem value="teacher" />
            {dict.register.roleTeacher}
          </Label>
        </RadioGroup>
      </div>

      <Button type="submit" size="lg" className="mt-2 h-10" disabled={submitting}>
        {submitting ? dict.register.submitting : dict.register.submit}
      </Button>
    </form>
  );
}
