"use client";

import { useCallback, useMemo, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Copy,
  GraduationCap,
  IdCard,
  KeyRound,
  Lock,
  LockOpen,
  Mail,
  Pencil,
  Plus,
  Search,
} from "lucide-react";

import { PaginationControls } from "@/components/pagination-controls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  createAccountByAdminAction,
  listAccountsAction,
  resetPasswordByAdminAction,
  setAccountStatusAction,
  updateAccountByAdminAction,
  type AccountSummary,
} from "@/lib/actions/accounts";
import type { PendingResetRequest } from "@/lib/actions/password-reset-requests";
import { formatMessage } from "@/lib/i18n/format";
import { getInitials } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Account, Role, SchoolClass } from "@/types";

const NONE_CLASS = "none";
const PAGE_SIZE = 10;
type SortMode = "default" | "class";

interface KnownCredentials {
  fullName: string;
  email: string;
  password: string;
}

export function AdminAccountsClient({
  adminAccount,
  initialAccounts,
  classes,
  resetRequests: initialResetRequests,
  dict,
}: {
  adminAccount: Account;
  initialAccounts: AccountSummary[];
  classes: SchoolClass[];
  resetRequests: PendingResetRequest[];
  dict: Dictionary;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [classId, setClassId] = useState<string>(NONE_CLASS);
  const [error, setError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const [detailTarget, setDetailTarget] = useState<AccountSummary | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editClassId, setEditClassId] = useState<string>(NONE_CLASS);
  const [editError, setEditError] = useState<string | null>(null);

  const [knownCredentials, setKnownCredentials] = useState<Record<string, KnownCredentials>>({});
  const [resetRequests, setResetRequests] = useState(initialResetRequests);

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [page, setPage] = useState(1);

  const className = useCallback(
    (id: string | null) => classes.find((c) => c.id === id)?.className ?? null,
    [classes]
  );
  const classSelectLabel = (value: string) =>
    value === NONE_CLASS ? dict.admin.accounts.noClass : (className(value) ?? dict.admin.accounts.chooseClass);

  const query = search.trim().toLowerCase();
  const filteredAccounts = useMemo(
    () =>
      accounts.filter(({ account: acc, email: accEmail }) => {
        if (!query) return true;
        return (
          acc.fullName.toLowerCase().includes(query) ||
          acc.id_login.toLowerCase().includes(query) ||
          accEmail.toLowerCase().includes(query)
        );
      }),
    [accounts, query]
  );

  const sortedAccounts = useMemo(() => {
    if (sortMode !== "class") return filteredAccounts;
    return [...filteredAccounts].sort((a, b) => {
      const classA = className(a.account.classId) ?? "";
      const classB = className(b.account.classId) ?? "";
      if (classA === classB) return a.account.fullName.localeCompare(b.account.fullName);
      if (!classA) return 1;
      if (!classB) return -1;
      return classA.localeCompare(classB);
    });
  }, [filteredAccounts, sortMode, className]);

  const totalPages = Math.max(1, Math.ceil(sortedAccounts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAccounts = sortedAccounts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const buildCredentialsText = (entry: KnownCredentials) =>
    `${entry.fullName}\n${dict.admin.accounts.emailLabel}: ${entry.email}\n${dict.admin.accounts.passwordLabel}: ${entry.password}`;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyCredentials = async (id_login: string) => {
    const entry = knownCredentials[id_login];
    if (!entry) return;
    const ok = await copyText(buildCredentialsText(entry));
    if (ok) {
      toast.success(formatMessage(dict.admin.accounts.copyCredentialsSuccess, { name: entry.fullName }));
    } else {
      toast.error(dict.admin.accounts.copyFailed);
    }
  };

  const handleCopyAll = async () => {
    const entries = Object.values(knownCredentials);
    if (entries.length === 0) {
      toast.error(dict.admin.accounts.copyAllEmpty);
      return;
    }
    const ok = await copyText(entries.map(buildCredentialsText).join("\n\n"));
    if (ok) {
      toast.success(formatMessage(dict.admin.accounts.copyAllSuccess, { count: entries.length }));
    } else {
      toast.error(dict.admin.accounts.copyFailed);
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("student");
    setClassId(NONE_CLASS);
    setError(null);
  };

  const handleCreate = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const result = await createAccountByAdminAction({
      fullName,
      email,
      password,
      role,
      classId: role !== "admin" && classId !== NONE_CLASS ? classId : null,
    });

    if (result.error !== undefined) {
      setError(result.error);
      return;
    }

    setAccounts(await listAccountsAction());
    setDialogOpen(false);
    const createdName = fullName.trim();
    const createdEmail = email.trim();
    const createdPassword = password;
    setKnownCredentials((prev) => ({
      ...prev,
      [result.id_login]: { fullName: createdName, email: createdEmail, password: createdPassword },
    }));
    resetForm();
    toast.success(
      formatMessage(dict.admin.accounts.createSuccess, { name: createdName, id: result.id_login }),
      { duration: 10000 }
    );
  };

  const handleResetPasswordSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError(null);
    if (!detailTarget) return;
    const target = detailTarget.account;

    const result = await resetPasswordByAdminAction(target.id_login, newPassword);
    if (result.error !== undefined) {
      setResetError(result.error);
      return;
    }

    setKnownCredentials((prev) => ({
      ...prev,
      [target.id_login]: { fullName: target.fullName, email: detailTarget.email, password: newPassword },
    }));
    setResetRequests((prev) => prev.filter((r) => r.accountId !== target.id_login));
    toast.success(formatMessage(dict.admin.accounts.resetSuccess, { name: target.fullName }));
    setNewPassword("");
  };

  const openDetailByAccountId = (accountId: string) => {
    const summary = accounts.find((a) => a.account.id_login === accountId);
    if (summary) openDetail(summary);
  };

  const openDetail = (summary: AccountSummary) => {
    setDetailTarget(summary);
    setEditFullName(summary.account.fullName);
    setEditClassId(summary.account.classId ?? NONE_CLASS);
    setEditError(null);
    setNewPassword("");
    setResetError(null);
  };

  const handleEditSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditError(null);
    if (!detailTarget) return;
    const editTarget = detailTarget.account;

    const result = await updateAccountByAdminAction(editTarget.id_login, {
      fullName: editFullName,
      classId: editTarget.role !== "admin" && editClassId !== NONE_CLASS ? editClassId : null,
    });
    if (result.error !== undefined) {
      setEditError(result.error);
      return;
    }

    const updatedAccounts = await listAccountsAction();
    setAccounts(updatedAccounts);
    const refreshed = updatedAccounts.find((a) => a.account.id_login === editTarget.id_login);
    if (refreshed) setDetailTarget(refreshed);
    toast.success(formatMessage(dict.admin.accounts.saveSuccess, { name: editFullName.trim() }));
  };

  const handleToggleStatus = async (id_login: string, name: string, active: boolean) => {
    const ok = await setAccountStatusAction(id_login, active ? "inactive" : "active");
    if (!ok) {
      toast.error(dict.admin.accounts.lockError);
      return;
    }
    setAccounts(await listAccountsAction());
    toast.success(
      formatMessage(dict.admin.accounts.lockSuccess, {
        action: active ? dict.admin.accounts.lockAction : dict.admin.accounts.unlockAction,
        name,
      })
    );
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
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
            <span className="font-heading text-base font-semibold">{dict.common.brand}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {dict.admin.accounts.title}
            </h1>
            <p className="text-muted-foreground">{dict.admin.accounts.subtitle}</p>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              {dict.admin.accounts.createButton}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dict.admin.accounts.createTitle}</DialogTitle>
                <DialogDescription>{dict.admin.accounts.createDesc}</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} noValidate className="flex flex-col gap-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fullName">{dict.admin.accounts.fullNameLabel}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={dict.register.fullNamePlaceholder}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">{dict.admin.accounts.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@vocabapp.vn"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">{dict.admin.accounts.passwordLabel}</Label>
                  <Input
                    id="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={dict.register.passwordPlaceholder}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>{dict.admin.accounts.roleLabel}</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(value) => setRole(value as Role)}
                    className="grid-cols-2"
                  >
                    <Label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 has-data-checked:border-primary">
                      <RadioGroupItem value="student" />
                      {dict.roles.student}
                    </Label>
                    <Label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 has-data-checked:border-primary">
                      <RadioGroupItem value="teacher" />
                      {dict.roles.teacher}
                    </Label>
                  </RadioGroup>
                </div>

                {role !== "admin" && (
                  <div className="flex flex-col gap-1.5">
                    <Label>{dict.admin.accounts.classLabel}</Label>
                    <Select value={classId} onValueChange={(value) => setClassId(value ?? NONE_CLASS)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={dict.admin.accounts.chooseClass}>
                          {classSelectLabel}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_CLASS}>{dict.admin.accounts.noClass}</SelectItem>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit">{dict.admin.accounts.createSubmit}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {resetRequests.length > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-1 py-4">
              <p className="mb-2 text-sm font-medium">{dict.admin.accounts.resetRequestsTitle}</p>
              {resetRequests.map((req, index) => (
                <div key={req.id}>
                  {index > 0 && <div className="my-2 h-px bg-border" />}
                  <div className="flex items-center justify-between gap-3 py-1">
                    <div>
                      <span className="font-medium">{req.fullName}</span>{" "}
                      <span className="text-sm text-muted-foreground">— {req.email}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailByAccountId(req.accountId)}
                    >
                      <KeyRound className="size-3.5" />
                      {dict.admin.accounts.resetRequestButton}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={dict.admin.accounts.searchPlaceholder}
              className="pl-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void handleCopyAll()}>
              <Copy className="size-3.5" />
              {dict.admin.accounts.copyAllButton}
            </Button>

            <Label className="text-sm text-muted-foreground whitespace-nowrap">
              {dict.admin.accounts.sortLabel}
            </Label>
            <Select
              value={sortMode}
              onValueChange={(value) => {
                setSortMode((value as SortMode) ?? "default");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue>
                  {(value: SortMode) =>
                    value === "class" ? dict.admin.accounts.sortByClass : dict.admin.accounts.sortDefault
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{dict.admin.accounts.sortDefault}</SelectItem>
                <SelectItem value="class">{dict.admin.accounts.sortByClass}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            {pagedAccounts.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {dict.admin.accounts.noResults}
              </p>
            )}
            {pagedAccounts.map((summary, index) => {
              const acc = summary.account;
              const accEmail = summary.email;
              const isSelf = acc.id_login === adminAccount.id_login;
              const isActive = acc.status === "active";
              const initials = getInitials(acc.fullName);

              return (
                <div key={acc.id_login}>
                  {index > 0 && <div className="my-3 h-px bg-border" />}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {acc.fullName}{" "}
                          {isSelf && <span className="text-muted-foreground">{dict.admin.accounts.you}</span>}
                        </p>
                        <div className="flex flex-col text-sm text-muted-foreground">
                          <span>
                            {dict.admin.accounts.idLabel}: <span className="font-mono">{acc.id_login}</span>
                          </span>
                          <span>{accEmail}</span>
                          {acc.role !== "admin" && (
                            <span>
                              {dict.admin.accounts.classShort}:{" "}
                              {acc.classId ? className(acc.classId) : dict.admin.accounts.noClass}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{dict.roles[acc.role]}</Badge>
                      <Badge variant={isActive ? "default" : "destructive"}>
                        {isActive ? dict.accountStatus.active : dict.accountStatus.inactive}
                      </Badge>

                      <Button variant="outline" size="sm" onClick={() => openDetail(summary)}>
                        <IdCard className="size-3.5" />
                        {dict.admin.accounts.detailButton}
                      </Button>

                      {!isSelf && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleToggleStatus(acc.id_login, acc.fullName, isActive)}
                          >
                            {isActive ? (
                              <>
                                <Lock className="size-3.5" />
                                {dict.admin.accounts.lockButton}
                              </>
                            ) : (
                              <>
                                <LockOpen className="size-3.5" />
                                {dict.admin.accounts.unlockButton}
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Dialog
        open={detailTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailTarget(null);
            setEditError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.admin.accounts.detailTitle}</DialogTitle>
            <DialogDescription>{dict.admin.accounts.detailDesc}</DialogDescription>
          </DialogHeader>

          {detailTarget && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback>{getInitials(detailTarget.account.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{detailTarget.account.fullName}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{dict.roles[detailTarget.account.role]}</Badge>
                    <Badge variant={detailTarget.account.status === "active" ? "default" : "destructive"}>
                      {detailTarget.account.status === "active"
                        ? dict.accountStatus.active
                        : dict.accountStatus.inactive}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="size-3.5 shrink-0" />
                  <span>
                    {dict.admin.accounts.idLabel}:{" "}
                    <span className="font-mono">{detailTarget.account.id_login}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <span>{detailTarget.email}</span>
                </div>
                {detailTarget.account.role !== "admin" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="size-3.5 shrink-0" />
                    <span>
                      {detailTarget.account.classId
                        ? className(detailTarget.account.classId)
                        : dict.admin.accounts.noClass}
                    </span>
                  </div>
                )}
              </div>

              {knownCredentials[detailTarget.account.id_login] && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    {dict.admin.accounts.credentialsKnownLabel}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopyCredentials(detailTarget.account.id_login)}
                  >
                    <Copy className="size-3.5" />
                    {dict.admin.accounts.copyCredentials}
                  </Button>
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Pencil className="size-3.5" />
                  {dict.admin.accounts.editSection}
                </div>

                <form onSubmit={handleEditSubmit} noValidate className="flex flex-col gap-4">
                  {editError && (
                    <Alert variant="destructive">
                      <AlertCircle />
                      <AlertDescription>{editError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="editFullName">{dict.admin.accounts.fullNameLabel}</Label>
                    <Input
                      id="editFullName"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                    />
                  </div>

                  {detailTarget.account.role !== "admin" && (
                    <div className="flex flex-col gap-1.5">
                      <Label>
                        {detailTarget.account.role === "teacher"
                          ? dict.admin.accounts.classInChargeLabel
                          : dict.admin.accounts.classLabel}
                      </Label>
                      <Select
                        value={editClassId}
                        onValueChange={(value) => setEditClassId(value ?? NONE_CLASS)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={dict.admin.accounts.chooseClass}>
                            {classSelectLabel}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_CLASS}>{dict.admin.accounts.noClass}</SelectItem>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="submit">{dict.common.saveChanges}</Button>
                  </DialogFooter>
                </form>
              </div>

              {detailTarget.account.id_login !== adminAccount.id_login && (
                <>
                  <Separator />

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <KeyRound className="size-3.5" />
                      {dict.admin.accounts.resetPasswordTitle}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatMessage(dict.admin.accounts.resetPasswordDesc, {
                        name: detailTarget.account.fullName,
                      })}
                    </p>

                    <form onSubmit={handleResetPasswordSubmit} noValidate className="flex flex-col gap-4">
                      {resetError && (
                        <Alert variant="destructive">
                          <AlertCircle />
                          <AlertDescription>{resetError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="newPassword">{dict.admin.accounts.newPasswordLabel}</Label>
                        <Input
                          id="newPassword"
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={dict.register.passwordPlaceholder}
                        />
                      </div>

                      <DialogFooter>
                        <Button type="submit">{dict.admin.accounts.resetSubmit}</Button>
                      </DialogFooter>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
