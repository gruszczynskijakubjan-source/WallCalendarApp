export const THEMES = [
  "autumn",
  "winter",
  "spring",
  "summer",
  "christmas",
  "newyear",
  "valentines",
  "easter",
  "mayday",
] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  autumn: "Jesienny 🍂",
  winter: "Zimowy ❄️",
  spring: "Wiosenny 🌸",
  summer: "Letni ☀️",
  christmas: "Świąteczny 🎄",
  newyear: "Sylwestrowy 🎆",
  valentines: "Walentynkowy 💘",
  easter: "Wielkanocny 🐣",
  mayday: "Majówkowy 🌷",
};

const STORAGE_KEY = "app-theme";
const AUTO_KEY = "app-theme-auto";

/** Gauss's algorithm for the date of (Western) Easter Sunday in a given year. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

/**
 * A holiday theme that should override the seasonal default while `today`
 * falls within its window. Checked in priority order — first match wins.
 */
function holidayTheme(today: Date): Theme | null {
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const date = today.getDate();

  // New Year's — Dec 31 through Jan 2.
  if ((month === 11 && date === 31) || (month === 0 && date <= 2)) return "newyear";

  // Christmas — Dec 6 (Mikołajki) through Dec 30.
  if (month === 11 && date >= 6 && date <= 30) return "christmas";

  // Valentine's — Feb 10-14.
  if (month === 1 && date >= 10 && date <= 14) return "valentines";

  // Easter — Palm Sunday week through Easter Monday.
  const easter = easterSunday(year);
  const offsetFromEaster = daysBetween(today, easter);
  if (offsetFromEaster >= -7 && offsetFromEaster <= 1) return "easter";

  // Majówka — May 1-3 (Labour Day / Constitution Day long weekend).
  if (month === 4 && date >= 1 && date <= 3) return "mayday";

  return null;
}

/** Northern-hemisphere meteorological season, used outside any holiday window. */
function seasonalTheme(today: Date): Theme {
  const month = today.getMonth(); // 0 = January
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

/** The theme the app should show right now, ignoring any manual override. */
export function autoTheme(today: Date = new Date()): Theme {
  return holidayTheme(today) ?? seasonalTheme(today);
}

/** @deprecated use {@link autoTheme} */
export const autoSeasonalTheme = autoTheme;

/** Whether holiday/seasonal auto-switching is enabled. Defaults to on. */
export function isAutoThemeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(AUTO_KEY) !== "false";
}

export function setAutoThemeEnabled(enabled: boolean) {
  localStorage.setItem(AUTO_KEY, String(enabled));
  document.documentElement.setAttribute("data-theme", getStoredTheme());
}

/**
 * The active theme: while auto-switching is enabled, a holiday/seasonal
 * theme always wins over the user's manually stored choice during its
 * window. With auto-switching disabled, the manual choice always applies.
 */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "autumn";
  if (isAutoThemeEnabled()) {
    const holiday = holidayTheme(new Date());
    if (holiday) return holiday;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if ((THEMES as readonly string[]).includes(stored ?? "")) return stored as Theme;
  return isAutoThemeEnabled() ? seasonalTheme(new Date()) : "autumn";
}

/** Manually picking a theme turns off auto-switching, so the choice sticks. */
export function setStoredTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  localStorage.setItem(AUTO_KEY, "false");
  document.documentElement.setAttribute("data-theme", theme);
}
