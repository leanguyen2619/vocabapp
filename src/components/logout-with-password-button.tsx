"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LogOut } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { logoutWithPasswordAction } from "@/lib/actions/auth";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** A logout control gated behind re-entering the current password — see
 * logoutWithPasswordAction's own comment for why. Self-contained (owns its dialog + form state)
 * so any Server Component page can just drop it into a header without becoming a client
 * component itself. */
export function LogoutWithPasswordButton({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setPassword("");
    setError(null);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!password) {
      setError(dict.warmup.logoutErrorEmpty);
      return;
    }

    setSubmitting(true);
    const result = await logoutWithPasswordAction(password);
    setSubmitting(false);

    if (result.error !== undefined) {
      setError(result.error);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label={dict.common.logout} onClick={() => setOpen(true)}>
        <LogOut className="size-4" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.warmup.logoutDialogTitle}</DialogTitle>
            <DialogDescription>{dict.warmup.logoutDialogDesc}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="logoutPassword">{dict.login.passwordLabel}</Label>
              <PasswordInput
                id="logoutPassword"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showLabel={dict.common.showPassword}
                hideLabel={dict.common.hidePassword}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict.warmup.logoutCancel}
              </Button>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {dict.warmup.logoutSubmit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
