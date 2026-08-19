"use client";

import { useEffect, useRef, useState } from "react";
import {
  format,
  parseISO,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
} from "date-fns";
import { pl } from "date-fns/locale";
import type { MergedEvent } from "@/app/api/calendar/events/route";
import type { EventInitialRange } from "@/components/EventDialog";
import type { DailyForecast } from "@/app/api/weather/forecast/route";
import { weatherIcon } from "@/lib/weatherIcon";
import { getHolidayForDate } from "@/lib/polishHolidays";
import { getDeviceLocation } from "@/lib/deviceLocation";

const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];
const MAX_VISIBLE_PER_DAY = 3;

export default function MonthView({
  date,
  events,
  onSelectDay,
  onSelectEvent,
  onCreateEvent,
}: {
  date: Date;
  events: MergedEvent[];
  onSelectDay: (day: Date) => void;
  onSelectEvent: (event: MergedEvent) => void;
  onCreateEvent: (range: EventInitialRange) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const [dragRange, setDragRange] = useState<{ startIndex: number; endIndex: number } | null>(
    null,
  );
  const draggingRef = useRef(false);

  const [forecast, setForecast] = useState<Record<string, DailyForecast>>({});

  useEffect(() => {
    const location = getDeviceLocation();
    const params = location ? `?lat=${location.lat}&lon=${location.lon}` : "";
    fetch(`/api/weather/forecast${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { forecast: DailyForecast[] } | null) => {
        if (!data) return;
        const byDate: Record<string, DailyForecast> = {};
        for (const day of data.forecast) byDate[day.date] = day;
        setForecast(byDate);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <h2 className="mb-2 shrink-0 text-lg font-semibold capitalize text-foreground">
        {format(date, "LLLL yyyy", { locale: pl })}
      </h2>

      <div className="grid shrink-0 grid-cols-7 gap-px text-center text-xs font-medium text-foreground/40">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 touch-none grid-cols-7 grid-rows-6 gap-px overflow-hidden rounded-lg bg-surface-muted select-none"
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          const target = document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest<HTMLElement>("[data-day-index]");
          const dayIndex = target ? Number(target.dataset.dayIndex) : null;
          if (dayIndex === null) return;
          setDragRange((prev) => (prev ? { ...prev, endIndex: dayIndex } : prev));
        }}
        onPointerUp={() => {
          if (!draggingRef.current || !dragRange) return;
          draggingRef.current = false;
          const minIndex = Math.min(dragRange.startIndex, dragRange.endIndex);
          const maxIndex = Math.max(dragRange.startIndex, dragRange.endIndex);
          setDragRange(null);
          onCreateEvent({
            start: days[minIndex],
            end: addDays(days[maxIndex], 1),
            allDay: true,
          });
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          setDragRange(null);
        }}
      >
        {days.map((day, dayIndex) => {
          const dayEvents = events.filter(
            (e) => e.start && isSameDay(parseISO(e.start), day),
          );
          const visible = dayEvents.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = dayEvents.length - visible.length;
          const isInDragRange =
            dragRange &&
            dayIndex >= Math.min(dragRange.startIndex, dragRange.endIndex) &&
            dayIndex <= Math.max(dragRange.startIndex, dragRange.endIndex);
          const dateKey = format(day, "yyyy-MM-dd");
          const holiday = getHolidayForDate(dateKey);
          const dayForecast = forecast[dateKey];

          return (
            <div
              key={day.toISOString()}
              data-day-index={dayIndex}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                draggingRef.current = true;
                setDragRange({ startIndex: dayIndex, endIndex: dayIndex });
              }}
              title={holiday ?? undefined}
              className={`flex flex-col items-stretch overflow-hidden bg-surface p-1 ${
                isSameMonth(day, date) ? "" : "opacity-40"
              } ${holiday ? "bg-accent-gold/10" : ""} ${
                isInDragRange ? "bg-accent-teal/10 ring-2 ring-inset ring-accent-teal" : ""
              }`}
            >
              <button
                onClick={() => onSelectDay(day)}
                className="mb-1 flex items-center justify-between rounded-lg text-left hover:bg-surface-muted"
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                    isToday(day)
                      ? "bg-accent-coral font-semibold text-white"
                      : holiday
                        ? "text-accent-gold"
                        : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayForecast && (
                  <span
                    className="pr-1 text-[10px] text-foreground/50"
                    title={`${Math.round(dayForecast.tempMinC)}° / ${Math.round(dayForecast.tempMaxC)}°`}
                  >
                    {weatherIcon(dayForecast.weatherCode)}{" "}
                    {Math.round(dayForecast.tempMaxC)}°
                  </span>
                )}
              </button>
              <span className="flex flex-col gap-0.5 overflow-hidden">
                {visible.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight text-white hover:brightness-95"
                    style={{ background: event.ownerColor }}
                  >
                    {event.ownerImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.ownerImage}
                        alt=""
                        className="h-3 w-3 shrink-0 rounded-full object-cover ring-1 ring-white/60"
                      />
                    )}
                    <span className="truncate">{event.summary}</span>
                  </button>
                ))}
                {overflow > 0 && (
                  <button
                    onClick={() => onSelectDay(day)}
                    className="text-left text-[11px] text-foreground/40 hover:underline"
                  >
                    +{overflow} więcej
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
