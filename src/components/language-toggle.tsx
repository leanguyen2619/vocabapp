"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export function LanguageToggle() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const next = locale === "vi" ? "en" : "vi";
    startTransition(async () => {
      // Wait for the cookie write to actually commit before asking the server to re-render —
      // otherwise refresh() can race it and come back with the old language, so nothing visibly
      // changes until the user clicks again.
      await setLocale(next);
      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Switch language"
      onClick={handleToggle}
      disabled={isPending}
    >
      <Languages className="size-4" />
      {locale === "vi" ? "EN" : "VI"}
    </Button>
  );
}
