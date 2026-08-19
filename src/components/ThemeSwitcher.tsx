"use client";

import { useState } from "react";
import {
  THEMES,
  THEME_LABELS,
  setStoredTheme,
  setAutoThemeEnabled,
  type Theme,
} from "@/lib/theme";

export default function ThemeSwitcher({
  initialTheme,
  initialAuto,
}: {
  initialTheme: Theme;
  initialAuto: boolean;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [auto, setAuto] = useState<boolean>(initialAuto);

  function select(next: Theme) {
    setTheme(next);
    setAuto(false);
    setStoredTheme(next);
  }

  function toggleAuto() {
    const next = !auto;
    setAuto(next);
    setAutoThemeEnabled(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex w-fit items-center gap-2 text-sm font-medium text-foreground/80">
        <input type="checkbox" checked={auto} onChange={toggleAuto} className="h-4 w-4" />
        Automatyczne motywy (świąteczne i sezonowe)
      </label>

      <div className="flex flex-wrap gap-2">
        {THEMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => select(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              theme === t
                ? "bg-accent-teal text-white"
                : "bg-surface-muted text-foreground/70 hover:bg-border"
            }`}
          >
            {THEME_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
