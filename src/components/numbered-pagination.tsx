"use client";

import { ChevronRight } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Google-results-style pagination: a row of page number buttons plus a "Tiếp" link to the next
 * page, rather than the plain prev/next-arrow "Trang X/Y" control (see PaginationControls) used
 * elsewhere — a better fit for a long list (like the admin student roster) where jumping straight
 * to a specific page matters more than just stepping one at a time. */
export function NumberedPagination({
  page,
  totalPages,
  onPageChange,
  dict,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  dict: Dictionary;
}) {
  if (totalPages <= 1) return null;

  const MAX_VISIBLE = 10;
  let start = Math.max(1, page - Math.floor(MAX_VISIBLE / 2));
  const end = Math.min(totalPages, start + MAX_VISIBLE - 1);
  start = Math.max(1, end - MAX_VISIBLE + 1);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 pt-2 font-heading">
      {pageNumbers.map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === page ? "page" : undefined}
          onClick={() => onPageChange(n)}
          className={cn(
            "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
            n === page
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {n}
        </button>
      ))}
      {page < totalPages && (
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          className="ml-2 flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
        >
          {dict.pagination.next}
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}
