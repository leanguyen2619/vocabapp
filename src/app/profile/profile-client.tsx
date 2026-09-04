"use client";

import { useRef, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Camera,
  Flame,
  GraduationCap,
  KeyRound,
  LogOut,
  Mail,
  Pencil,
  Trophy,
} from "lucide-react";

import { LevelCard } from "@/components/level-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  changePasswordAction,
  logoutAction,
  removeAvatarAction,
  updateAvatarAction,
  updateFullNameAction,
} from "@/lib/actions/auth";
import { fileToAvatarDataUrl } from "@/lib/avatar-image";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SessionAccount } from "@/lib/session";
import { getInitials } from "@/lib/utils";
import type { LevelWithProgress } from "@/types";

export function ProfileClient({
  account,
  levels,
  className,
  dict,
}: {
  account: SessionAccount;
  levels: LevelWithProgress[];
  className: string | null;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(account.fullName);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(account.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const initials = getInitials(displayName);

  const unlockedLevels = levels.filter((level) => level.status !== "locked");
  const totalMastered = unlockedLevels.reduce((sum, l) => sum + l.masteredVocab, 0);
  const totalVocab = unlockedLevels.reduce((sum, l) => sum + l.totalVocab, 0);
  const completedLevels = levels.filter((level) => level.status === "completed").length;
  const streak = Math.max(0, ...levels.map((level) => level.streak));

  const handleLogout = async () => {
    await logoutAction();
    router.push("/");
    router.refresh();
  };

  const startEditing = () => {
    setFullName(displayName);
    setEditing(true);
  };

  const handleAvatarChange = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(dict.profile.avatarErrorType);
      return;
    }
    setAvatarUploading(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const result = await updateAvatarAction(dataUrl);
      if (result.error !== undefined) {
        toast.error(result.error);
        return;
      }
      setAvatarUrl(result.avatarUrl);
      toast.success(dict.profile.avatarUpdateSuccess);
    } catch {
      toast.error(dict.profile.avatarErrorGeneric);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const result = await removeAvatarAction();
    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }
    setAvatarUrl(null);
    toast.success(dict.profile.avatarRemoveSuccess);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error(dict.profile.errorNameEmpty);
      return;
    }
    const result = await updateFullNameAction(fullName);
    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }
    setDisplayName(result.fullName);
    setEditing(false);
    toast.success(dict.profile.successUpdate);
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const handleChangePassword = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(dict.profile.errorFillAll);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(dict.profile.errorPasswordLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(dict.profile.errorPasswordMismatch);
      return;
    }

    const result = await changePasswordAction(currentPassword, newPassword);
    if (result.error !== undefined) {
      setPasswordError(result.error);
      return;
    }

    setPasswordDialogOpen(false);
    resetPasswordForm();
    toast.success(dict.profile.successPassword);
  };

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {dict.common.backToDashboard}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">VocabApp</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-4 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="relative shrink-0">
              <Avatar className="size-16">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label={dict.profile.changeAvatar}
                className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                <Camera className="size-3" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleAvatarChange(file);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {editing ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                    maxLength={100}
                    className="max-w-56"
                  />
                  <div className="flex justify-center gap-2 sm:justify-start">
                    <Button size="sm" onClick={handleSave}>
                      {dict.common.save}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      {dict.common.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <h1 className="font-heading text-xl font-semibold tracking-tight">
                    {displayName}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={dict.profile.editName}
                    onClick={startEditing}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant="secondary">{dict.roles[account.role]}</Badge>
                {className && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <GraduationCap className="size-3.5" />
                    {className}
                  </span>
                )}
                {account.email && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="size-3.5" />
                    {account.email}
                  </span>
                )}
              </div>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => void handleRemoveAvatar()}
                  className="self-center text-xs text-muted-foreground underline hover:text-foreground sm:self-start"
                >
                  {dict.profile.removeAvatar}
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Dialog
                open={passwordDialogOpen}
                onOpenChange={(open) => {
                  setPasswordDialogOpen(open);
                  if (!open) resetPasswordForm();
                }}
              >
                <DialogTrigger render={<Button variant="outline" size="sm" />}>
                  <KeyRound className="size-4" />
                  {dict.profile.changePassword}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{dict.profile.changePasswordTitle}</DialogTitle>
                    <DialogDescription>{dict.profile.changePasswordDesc}</DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleChangePassword} noValidate className="flex flex-col gap-4">
                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertCircle />
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="currentPassword">{dict.profile.currentPassword}</Label>
                      <PasswordInput
                        id="currentPassword"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        showLabel={dict.common.showPassword}
                        hideLabel={dict.common.hidePassword}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="newPassword">{dict.profile.newPassword}</Label>
                      <PasswordInput
                        id="newPassword"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={dict.profile.newPasswordPlaceholder}
                        showLabel={dict.common.showPassword}
                        hideLabel={dict.common.hidePassword}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="confirmPassword">{dict.profile.confirmNewPassword}</Label>
                      <PasswordInput
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        showLabel={dict.common.showPassword}
                        hideLabel={dict.common.hidePassword}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit">{dict.profile.changePassword}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4" />
                {dict.common.logout}
              </Button>
            </div>
          </CardContent>
        </Card>

        {account.role === "student" && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex size-9 items-center justify-center rounded-full bg-orange-500/10">
                    <Flame className="size-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold leading-none">{streak}</p>
                    <p className="text-xs text-muted-foreground">{dict.profile.streakDays}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                    <BookOpen className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold leading-none">
                      {totalMastered}/{totalVocab}
                    </p>
                    <p className="text-xs text-muted-foreground">{dict.profile.wordsMastered}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/10">
                    <Trophy className="size-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold leading-none">{completedLevels}</p>
                    <p className="text-xs text-muted-foreground">{dict.profile.levelsCompleted}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                {dict.profile.levelProgress}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {levels.map((level) => (
                  <LevelCard key={level.id} level={level} dict={dict} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
