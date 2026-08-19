"use client";

import {
  format,
  parseISO,
  isSameMonth,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
} from "date-fns";
import { pl } from "date-fns/locale";
import type { MergedEvent } from "@/app/api/calendar/events/route";

const WEEKDAY_LABELS = ["P", "W", "Ś", "C", "P", "S", "N"];

function MiniMonth({
  month,
  events,
  onSelectDay,
}: {
  month: Date;
  events: MergedEvent[];
  onSelectDay: (day: Date) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const eventDays = new Set(
    events.filter((e) => e.start).map((e) => format(parseISO(e.start!), "yyyy-MM-dd")),
  );

  return (
    <div className="rounded-xl border border-gray-100 p-2">
      <h3 className="mb-1 text-center text-sm font-semibold capitalize text-gray-700">
        {format(month, "LLLL", { locale: pl })}
      </h3>
      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[10px] text-gray-400">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={`${label}-${i}`}>{label}</div>
        ))}
        {days.map((day) => {
          const hasEvent = eventDays.has(format(day, "yyyy-MM-dd"));
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={`relative mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] hover:bg-gray-100 ${
                isSameMonth(day, month) ? "text-gray-700" : "text-gray-300"
              } ${isToday(day) ? "bg-blue-600 font-semibold text-white hover:bg-blue-600" : ""}`}
            >
              {format(day, "d")}
              {hasEvent && !isToday(day) && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function YearView({
  date,
  events,
  onSelectDay,
}: {
  date: Date;
  events: MergedEvent[];
  onSelectDay: (day: Date) => void;
}) {
  const months = eachMonthOfInterval({
    start: startOfYear(date),
    end: endOfYear(date),
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <h2 className="mb-2 shrink-0 text-lg font-semibold text-gray-700">
        {format(date, "yyyy")}
      </h2>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 overflow-y-auto">
        {months.map((month) => (
          <MiniMonth
            key={month.toISOString()}
            month={month}
            events={events}
            onSelectDay={onSelectDay}
          />
        ))}
      </div>
    </div>
  );
}
