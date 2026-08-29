"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { loginAction } from "@/lib/actions/auth";
import { createPasswordResetRequestAction } from "@/lib/actions/password-reset-requests";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type InvalidField = "email" | "password" | null;

export function LoginForm({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<InvalidField>(null);
  const [submitting, setSubmitting] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInvalidField(null);

    if (!email.trim() || !password) {
      setError(dict.login.errorFillAll);
      setInvalidField(!email.trim() ? "email" : "password");
      return;
    }

    setSubmitting(true);
    const result = await loginAction(email, password);
    setSubmitting(false);

    if (result.error !== undefined) {
      setError(result.error);
      setInvalidField("password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleForgotSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotError(null);

    if (!forgotEmail.trim()) {
      setForgotError(dict.login.forgotPasswordErrorFillEmail);
      return;
    }

    setForgotSubmitting(true);
    await createPasswordResetRequestAction(forgotEmail);
    setForgotSubmitting(false);

    setForgotOpen(false);
    setForgotEmail("");
    toast.success(dict.login.forgotPasswordSuccess, { duration: 8000 });
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
        <Label htmlFor="email">{dict.login.emailLabel}</Label>
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{dict.login.passwordLabel}</Label>
          <Dialog
            open={forgotOpen}
            onOpenChange={(open) => {
              setForgotOpen(open);
              if (!open) {
                setForgotEmail("");
                setForgotError(null);
              }
            }}
          >
            <DialogTrigger
              render={
                <button type="button" className="text-xs font-medium text-primary hover:underline" />
              }
            >
              {dict.login.forgotPassword}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dict.login.forgotPasswordTitle}</DialogTitle>
                <DialogDescription>{dict.login.forgotPasswordDesc}</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleForgotSubmit} noValidate className="flex flex-col gap-4">
                {forgotError && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="forgotEmail">{dict.login.forgotPasswordEmailLabel}</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ban@vocabapp.vn"
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={forgotSubmitting}>
                    {forgotSubmitting ? dict.login.forgotPasswordSubmitting : dict.login.forgotPasswordSubmit}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
          aria-invalid={invalidField === "password"}
          showLabel={dict.common.showPassword}
          hideLabel={dict.common.hidePassword}
        />
      </div>

      <Button type="submit" size="lg" className="mt-2 h-10" disabled={submitting}>
        {submitting ? dict.login.submitting : dict.login.submit}
      </Button>
    </form>
  );
}
