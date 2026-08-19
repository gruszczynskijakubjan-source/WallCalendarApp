export const THEMES = ["autumn", "winter", "spring", "summer"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  autumn: "Jesienny 🍂",
  winter: "Zimowy ❄️",
  spring: "Wiosenny 🌸",
  summer: "Letni ☀️",
};

const STORAGE_KEY = "app-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "autumn";
  const stored = localStorage.getItem(STORAGE_KEY);
  return (THEMES as readonly string[]).includes(stored ?? "")
    ? (stored as Theme)
    : autoSeasonalTheme();
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

/** Northern-hemisphere meteorological season, used as the default until the user picks one. */
export function autoSeasonalTheme(): Theme {
  const month = new Date().getMonth(); // 0 = January
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}
