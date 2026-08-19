"use client";

import { useRef, useState } from "react";
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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <h2 className="mb-2 shrink-0 text-lg font-semibold capitalize text-gray-700">
        {format(date, "LLLL yyyy", { locale: pl })}
      </h2>

      <div className="grid shrink-0 grid-cols-7 gap-px text-center text-xs font-medium text-gray-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 touch-none grid-cols-7 grid-rows-6 gap-px overflow-hidden rounded-lg bg-gray-100 select-none"
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

          return (
            <div
              key={day.toISOString()}
              data-day-index={dayIndex}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                draggingRef.current = true;
                setDragRange({ startIndex: dayIndex, endIndex: dayIndex });
              }}
              className={`flex flex-col items-stretch overflow-hidden bg-white p-1 ${
                isSameMonth(day, date) ? "" : "opacity-40"
              } ${isInDragRange ? "bg-blue-50 ring-2 ring-inset ring-blue-400" : ""}`}
            >
              <button
                onClick={() => onSelectDay(day)}
                className="mb-1 flex items-center rounded-lg text-left hover:bg-gray-50"
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                    isToday(day) ? "bg-blue-600 font-semibold text-white" : "text-gray-700"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </button>
              <span className="flex flex-col gap-0.5 overflow-hidden">
                {visible.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight text-white hover:brightness-95"
                    style={{ background: event.ownerColor }}
                  >
                    {event.summary}
                  </button>
                ))}
                {overflow > 0 && (
                  <button
                    onClick={() => onSelectDay(day)}
                    className="text-left text-[11px] text-gray-400 hover:underline"
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
