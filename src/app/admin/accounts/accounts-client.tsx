"use client";

import { useMemo, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  KeyRound,
  Lock,
  LockOpen,
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
import {
  createAccountByAdminAction,
  listAccountsAction,
  resetPasswordByAdminAction,
  setAccountStatusAction,
  updateAccountByAdminAction,
  type AccountSummary,
} from "@/lib/actions/accounts";
import type { Account, Role, SchoolClass } from "@/types";

const roleLabel: Record<Role, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  admin: "Quản trị viên",
};

const NONE_CLASS = "none";
const PAGE_SIZE = 10;

export function AdminAccountsClient({
  adminAccount,
  initialAccounts,
  classes,
}: {
  adminAccount: Account;
  initialAccounts: AccountSummary[];
  classes: SchoolClass[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [classId, setClassId] = useState<string>(NONE_CLASS);
  const [error, setError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<{ id_login: string; fullName: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editClassId, setEditClassId] = useState<string>(NONE_CLASS);
  const [editError, setEditError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const className = (id: string | null) => classes.find((c) => c.id === id)?.className ?? null;
  const classSelectLabel = (value: string) =>
    value === NONE_CLASS ? "Chưa có lớp" : (className(value) ?? "Chọn lớp");

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
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAccounts = filteredAccounts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
    resetForm();
    toast.success(`Đã tạo tài khoản cho ${createdName}. Mã đăng nhập: ${result.id_login}`, {
      duration: 10000,
    });
  };

  const handleResetPasswordSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError(null);
    if (!resetTarget) return;

    const result = await resetPasswordByAdminAction(resetTarget.id_login, newPassword);
    if (result.error !== undefined) {
      setResetError(result.error);
      return;
    }

    toast.success(`Đã đặt lại mật khẩu cho ${resetTarget.fullName}.`);
    setResetTarget(null);
    setNewPassword("");
  };

  const openEdit = (acc: Account) => {
    setEditTarget(acc);
    setEditFullName(acc.fullName);
    setEditClassId(acc.classId ?? NONE_CLASS);
    setEditError(null);
  };

  const handleEditSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditError(null);
    if (!editTarget) return;

    const result = await updateAccountByAdminAction(editTarget.id_login, {
      fullName: editFullName,
      classId: editTarget.role !== "admin" && editClassId !== NONE_CLASS ? editClassId : null,
    });
    if (result.error !== undefined) {
      setEditError(result.error);
      return;
    }

    setAccounts(await listAccountsAction());
    setEditTarget(null);
    toast.success(`Đã cập nhật tài khoản ${editFullName.trim()}.`);
  };

  const handleToggleStatus = async (id_login: string, name: string, active: boolean) => {
    await setAccountStatusAction(id_login, active ? "inactive" : "active");
    setAccounts(await listAccountsAction());
    toast.success(`Đã ${active ? "khóa" : "mở khóa"} tài khoản ${name}.`);
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
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">VocabApp</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Quản lý tài khoản
            </h1>
            <p className="text-muted-foreground">
              Tạo tài khoản, đặt lại mật khẩu, khóa/mở khóa học sinh và giáo viên.
            </p>
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
              Tạo tài khoản
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo tài khoản mới</DialogTitle>
                <DialogDescription>
                  Tài khoản sẽ có thể đăng nhập ngay bằng email và mật khẩu bên dưới.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} noValidate className="flex flex-col gap-4">
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
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@vocabapp.vn"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Vai trò</Label>
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

                {role !== "admin" && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Lớp</Label>
                    <Select value={classId} onValueChange={(value) => setClassId(value ?? NONE_CLASS)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn lớp">{classSelectLabel}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_CLASS}>Chưa có lớp</SelectItem>
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
                  <Button type="submit">Tạo tài khoản</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên, mã đăng nhập, email..."
            className="pl-8"
          />
        </div>

        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            {pagedAccounts.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy tài khoản phù hợp.
              </p>
            )}
            {pagedAccounts.map(({ account: acc, email: accEmail }, index) => {
              const isSelf = acc.id_login === adminAccount.id_login;
              const isActive = acc.status === "active";
              const initials = acc.fullName
                .split(" ")
                .map((p) => p[0])
                .slice(-2)
                .join("")
                .toUpperCase();

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
                          {acc.fullName} {isSelf && <span className="text-muted-foreground">(Bạn)</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Mã: <span className="font-mono">{acc.id_login}</span> · {accEmail}
                          {acc.classId && <> · {className(acc.classId)}</>}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{roleLabel[acc.role]}</Badge>
                      <Badge variant={isActive ? "default" : "destructive"}>
                        {isActive ? "Hoạt động" : "Đã khóa"}
                      </Badge>

                      <Button variant="outline" size="sm" onClick={() => openEdit(acc)}>
                        <Pencil className="size-3.5" />
                        Sửa
                      </Button>

                      {!isSelf && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetTarget({ id_login: acc.id_login, fullName: acc.fullName });
                              setNewPassword("");
                              setResetError(null);
                            }}
                          >
                            <KeyRound className="size-3.5" />
                            Đặt lại mật khẩu
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleToggleStatus(acc.id_login, acc.fullName, isActive)}
                          >
                            {isActive ? (
                              <>
                                <Lock className="size-3.5" />
                                Khóa
                              </>
                            ) : (
                              <>
                                <LockOpen className="size-3.5" />
                                Mở khóa
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
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null);
            setNewPassword("");
            setResetError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              Đặt mật khẩu mới cho {resetTarget?.fullName}. Mật khẩu cũ sẽ không còn dùng được.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPasswordSubmit} noValidate className="flex flex-col gap-4">
            {resetError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{resetError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="text"
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <DialogFooter>
              <Button type="submit">Đặt lại mật khẩu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa tài khoản</DialogTitle>
            <DialogDescription>
              Cập nhật họ tên{editTarget && editTarget.role !== "admin" ? " và lớp phụ trách" : ""}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} noValidate className="flex flex-col gap-4">
            {editError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editFullName">Họ và tên</Label>
              <Input
                id="editFullName"
                autoFocus
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>

            {editTarget && editTarget.role !== "admin" && (
              <div className="flex flex-col gap-1.5">
                <Label>{editTarget.role === "teacher" ? "Lớp phụ trách" : "Lớp"}</Label>
                <Select value={editClassId} onValueChange={(value) => setEditClassId(value ?? NONE_CLASS)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn lớp">{classSelectLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_CLASS}>Chưa có lớp</SelectItem>
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
              <Button type="submit">Lưu thay đổi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
