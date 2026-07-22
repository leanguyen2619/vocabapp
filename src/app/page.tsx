import Link from "next/link";
import { BookOpen, ChevronDown, Search } from "lucide-react";

import { FeatureCarousel } from "@/components/feature-carousel";
import { HeaderAuthActions } from "@/components/header-auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-4 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-4" />
            </div>
            <span className="font-heading text-lg font-semibold">VocabApp</span>
          </Link>

          <nav className="hidden shrink-0 items-center gap-5 text-sm font-medium text-muted-foreground md:flex">
            <span className="flex cursor-default items-center gap-1 transition-colors hover:text-foreground">
              Công cụ học <ChevronDown className="size-3.5" />
            </span>
            <span className="flex cursor-default items-center gap-1 transition-colors hover:text-foreground">
              Chủ đề <ChevronDown className="size-3.5" />
            </span>
          </nav>

          <div className="hidden flex-1 md:block">
            <div className="relative mx-auto max-w-md">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm kiếm câu hỏi" className="h-10 pl-9" />
            </div>
          </div>

          <div className="ml-auto">
            <HeaderAuthActions />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center"
          >
            <div className="h-96 w-3xl rounded-full bg-linear-to-r from-sky-200 via-violet-200 to-rose-200 opacity-50 blur-3xl dark:opacity-20" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-28">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Bạn muốn học từ vựng như thế nào?
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground text-balance">
              Ghi nhớ từ vựng lâu hơn với thẻ ghi nhớ tương tác, bài kiểm tra thử và trò chơi ghép
              thẻ của VocabApp.
            </p>
            <Button
              size="lg"
              className="h-11 rounded-full px-6 text-base"
              nativeButton={false}
              render={<Link href="/register" />}
            >
              Đăng ký miễn phí
            </Button>
            <Link href="/register" className="text-sm font-medium text-primary hover:underline">
              Tôi là giáo viên
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pt-4 pb-24">
          <h2 className="mb-6 text-center font-heading text-2xl font-semibold tracking-tight sm:text-left">
            Chọn cách học phù hợp với bạn
          </h2>
          <FeatureCarousel />
        </section>
      </main>
    </div>
  );
}
