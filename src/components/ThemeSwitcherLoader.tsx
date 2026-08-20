"use client";

import { useEffect, useState } from "react";
import { getStoredTheme, isAutoThemeEnabled, type Theme } from "@/lib/theme";
import ThemeSwitcher from "@/components/ThemeSwitcher";

/**
 * localStorage only exists in the browser, so the server always renders the
 * default "autumn" theme. This reads the real value right after mount, once,
 * to avoid a server/client hydration mismatch in the child.
 */
export default function ThemeSwitcherLoader() {
  const [initialTheme, setInitialTheme] = useState<Theme>("autumn");
  const [initialAuto, setInitialAuto] = useState(true);

  useEffect(() => {
    setInitialTheme(getStoredTheme());
    setInitialAuto(isAutoThemeEnabled());
  }, []);

  return <ThemeSwitcher initialTheme={initialTheme} initialAuto={initialAuto} />;
}
