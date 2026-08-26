"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { dict } = useLocale();
  // next-themes only knows the real theme after mounting (it reads localStorage client-side) —
  // rendering the same icon the server would've rendered until then avoids a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isDark ? dict.common.switchToLightMode : dict.common.switchToDarkMode}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
