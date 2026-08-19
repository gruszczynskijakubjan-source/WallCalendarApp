import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfWeek,
  endOfWeek,
} from "date-fns";

export type CalendarView = "day" | "week" | "month" | "year";

/** Range of dates to fetch events for, given a view and the date it's centered on. */
export function getRangeForView(view: CalendarView, date: Date) {
  switch (view) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case "month":
      // Include the leading/trailing days from adjacent months shown in the grid.
      return {
        start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
      };
    case "year":
      return { start: startOfYear(date), end: endOfYear(date) };
  }
}
