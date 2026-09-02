"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";

export function PaginationControls({
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

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={dict.pagination.previousPage}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        {formatMessage(dict.pagination.pageLabel, { page, total: totalPages })}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={dict.pagination.nextPage}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
