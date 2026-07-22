"use client";

import { useRef } from "react";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const SCROLL_AMOUNT = 300;

export function FeatureCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({ left: direction * SCROLL_AMOUNT, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Xem thẻ trước"
        className="absolute top-1/2 left-0 z-10 hidden size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-muted sm:flex"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div
        ref={trackRef}
        className="no-scrollbar flex gap-5 overflow-x-auto scroll-smooth px-1 pb-2 sm:px-6"
      >
        {/* Học */}
        <div className="flex h-72 w-64 shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-linear-to-br from-sky-400 to-sky-500 p-5">
          <h3 className="text-lg font-semibold text-white">Học</h3>
          <div className="mt-5 flex flex-1 flex-col rounded-2xl bg-white p-4 shadow-lg">
            <div className="mb-4 flex h-20 items-center justify-center rounded-xl bg-linear-to-br from-sky-100 to-sky-300">
              <Sparkles className="size-8 text-sky-600" />
            </div>
            <p className="text-lg font-semibold text-foreground">ambitious</p>
            <p className="text-sm text-muted-foreground">có tham vọng</p>
          </div>
        </div>

        {/* Thẻ ghi nhớ */}
        <div className="flex h-72 w-64 shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-linear-to-br from-indigo-500 to-indigo-600 p-5">
          <h3 className="text-lg font-semibold text-white">Thẻ ghi nhớ</h3>
          <div className="relative mt-5 flex-1">
            <div className="absolute inset-x-3 top-4 h-full rounded-2xl bg-white/40" />
            <div className="absolute inset-x-0 top-0 flex h-[calc(100%-1rem)] flex-col items-center justify-center gap-1 rounded-2xl bg-white p-4 text-center shadow-lg">
              <p className="text-xl font-semibold text-foreground">reluctant</p>
              <p className="text-sm text-muted-foreground">/rɪˈlʌktənt/</p>
              <p className="mt-2 text-sm text-muted-foreground">miễn cưỡng</p>
            </div>
          </div>
        </div>

        {/* Kiểm tra */}
        <div className="flex h-72 w-64 shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-linear-to-br from-amber-300 to-amber-400 p-5">
          <h3 className="text-lg font-semibold text-neutral-900">Kiểm tra</h3>
          <div className="mt-5 flex flex-1 flex-col rounded-2xl bg-white p-4 shadow-lg">
            <p className="mb-4 text-sm text-muted-foreground">Thời gian: 6 phút</p>
            <div className="flex items-center gap-4">
              <div
                className="relative flex size-20 shrink-0 items-center justify-center rounded-full"
                style={{ background: "conic-gradient(#16a34a 82%, #fecaca 0)" }}
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-white text-base font-semibold text-foreground">
                  82%
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-600">
                  <Check className="size-3.5" />
                  18
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-sm font-medium text-red-500">
                  ✕ 4
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ghép thẻ */}
        <div className="flex h-72 w-64 shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-linear-to-br from-rose-300 to-rose-400 p-5">
          <h3 className="text-lg font-semibold text-neutral-900">Ghép thẻ</h3>
          <div className="mt-5 grid flex-1 grid-cols-2 gap-2 rounded-2xl bg-white p-4 shadow-lg">
            <div className="flex items-center justify-center rounded-lg bg-muted px-2 text-center text-sm font-medium">
              ambitious
            </div>
            <div className="flex items-center justify-center rounded-lg bg-muted px-2 text-center text-sm font-medium">
              có tham vọng
            </div>
            <div className="flex items-center justify-center gap-1 rounded-lg border-2 border-emerald-500 bg-emerald-50 px-2 text-center text-sm font-medium text-emerald-700">
              negotiate
              <Check className="size-3.5 shrink-0" />
            </div>
            <div className="flex items-center justify-center gap-1 rounded-lg border-2 border-emerald-500 bg-emerald-50 px-2 text-center text-sm font-medium text-emerald-700">
              đàm phán
              <Check className="size-3.5 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Xem thẻ tiếp theo"
        className="absolute top-1/2 right-0 z-10 hidden size-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-muted sm:flex"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
