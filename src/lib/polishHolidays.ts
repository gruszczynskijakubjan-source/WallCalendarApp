import { addDays, format } from "date-fns";
import type { MergedEvent } from "@/pages/api/calendar/events";

/** Computes Easter Sunday (Gregorian) for a given year via the Anonymous Gregorian algorithm. */
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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Polish statutory public holidays (dni ustawowo wolne od pracy) for a given year. */
export function getPolishHolidays(year: number): { date: string; name: string }[] {
  const easter = easterSunday(year);

  const fixed: { date: string; name: string }[] = [
    { date: `${year}-01-01`, name: "Nowy Rok" },
    { date: `${year}-01-06`, name: "Trzech Króli" },
    { date: `${year}-05-01`, name: "Święto Pracy" },
    { date: `${year}-05-03`, name: "Święto Konstytucji 3 Maja" },
    { date: `${year}-08-15`, name: "Wniebowzięcie NMP" },
    { date: `${year}-11-01`, name: "Wszystkich Świętych" },
    { date: `${year}-11-11`, name: "Święto Niepodległości" },
    { date: `${year}-12-25`, name: "Boże Narodzenie" },
    { date: `${year}-12-26`, name: "Boże Narodzenie (2. dzień)" },
  ];

  const movable: { date: string; name: string }[] = [
    { date: format(easter, "yyyy-MM-dd"), name: "Wielkanoc" },
    { date: format(addDays(easter, 1), "yyyy-MM-dd"), name: "Poniedziałek Wielkanocny" },
    { date: format(addDays(easter, 49), "yyyy-MM-dd"), name: "Zielone Świątki" },
    { date: format(addDays(easter, 60), "yyyy-MM-dd"), name: "Boże Ciało" },
  ];

  return [...fixed, ...movable].sort((a, b) => a.date.localeCompare(b.date));
}

/** Convenience lookup: holiday name for a specific yyyy-MM-dd date, if any. */
export function getHolidayForDate(dateKey: string): string | null {
  const year = Number(dateKey.slice(0, 4));
  const holidays = getPolishHolidays(year);
  return holidays.find((h) => h.date === dateKey)?.name ?? null;
}

export const HOLIDAYS_ACCOUNT_ID = "holidays-pl";
export const HOLIDAYS_ACCOUNT_COLOR = "#c0392b";

/** Polish holidays across a date range, shaped as pseudo-events for the calendar views. */
export function getHolidayEventsInRange(start: Date, end: Date): MergedEvent[] {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const events: MergedEvent[] = [];

  for (let year = startYear; year <= endYear; year++) {
    for (const holiday of getPolishHolidays(year)) {
      if (holiday.date < format(start, "yyyy-MM-dd") || holiday.date > format(end, "yyyy-MM-dd")) {
        continue;
      }
      events.push({
        id: `${HOLIDAYS_ACCOUNT_ID}:${holiday.date}`,
        accountId: HOLIDAYS_ACCOUNT_ID,
        ownerName: "Święta w Polsce",
        ownerImage: null,
        ownerColor: HOLIDAYS_ACCOUNT_COLOR,
        summary: holiday.name,
        start: holiday.date,
        end: format(addDays(new Date(holiday.date), 1), "yyyy-MM-dd"),
        allDay: true,
      });
    }
  }

  return events;
}
