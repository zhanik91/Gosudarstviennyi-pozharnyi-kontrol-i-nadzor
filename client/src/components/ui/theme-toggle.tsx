import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, getStoredTheme, persistTheme, type Theme } from "@/utils/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Переключить тему"
      aria-pressed={theme === "light"}
      onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
      className="text-slate-100 transition duration-200 hover:bg-primary/20 hover:text-white"
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}
