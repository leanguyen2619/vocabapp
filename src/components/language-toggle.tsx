"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export function LanguageToggle() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();

  const handleToggle = () => {
    setLocale(locale === "vi" ? "en" : "vi");
    router.refresh();
  };

  return (
    <Button variant="ghost" size="sm" aria-label="Switch language" onClick={handleToggle}>
      <Languages className="size-4" />
      {locale === "vi" ? "EN" : "VI"}
    </Button>
  );
}
