"use client";

import { useState } from "react";
import { THEMES, THEME_LABELS, setStoredTheme, type Theme } from "@/lib/theme";

export default function ThemeSwitcher({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function select(next: Theme) {
    setTheme(next);
    setStoredTheme(next);
  }

  return (
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
  );
}
