"use client";

import { useEffect, useRef, useState } from "react";
import {
  format,
  parseISO,
  isSameDay,
  isToday,
  startOfWeek,
  eachDayOfInterval,
  addDays,
  addMinutes,
} from "date-fns";
import { pl } from "date-fns/locale";
import type { MergedEvent } from "@/app/api/calendar/events/route";
import type { EventInitialRange } from "@/components/EventDialog";
import { useTimeGridSelection } from "@/lib/useTimeGridSelection";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT_PX = 64;
const SLOTS_PER_HOUR = 2;
const SLOT_MINUTES = 60 / SLOTS_PER_HOUR;
const SLOT_HEIGHT_PX = HOUR_HEIGHT_PX / SLOTS_PER_HOUR;
const TOTAL_SLOTS = HOURS.length * SLOTS_PER_HOUR;

function slotToDate(day: Date, slot: number) {
  const base = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  return addMinutes(base, slot * SLOT_MINUTES);
}

export default function WeekView({
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const { selection, startSelection, extendSelection, endSelection, cancelSelection } =
    useTimeGridSelection((sel) => {
      const minSlot = Math.min(sel.startSlot, sel.endSlot);
      const maxSlot = Math.max(sel.startSlot, sel.endSlot) + 1;
      const day = days[sel.columnIndex];
      onCreateEvent({ start: slotToDate(day, minSlot), end: slotToDate(day, maxSlot) });
    });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: (now.getHours() / 24) * HOUR_HEIGHT_PX * 24 - HOUR_HEIGHT_PX * 2,
      behavior: "instant",
    });
    // Only re-scroll when the displayed week changes, not on every clock tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.getTime()]);

  const nowOffsetPx = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT_PX;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-2 grid shrink-0 grid-cols-[3rem_repeat(7,1fr)] gap-px">
        <div />
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDay(day)}
            className="flex flex-col items-center rounded-lg py-1 hover:bg-gray-50"
          >
            <span className="text-xs font-medium text-gray-400 capitalize">
              {format(day, "EEE", { locale: pl })}
            </span>
            <span
              className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                isToday(day) ? "bg-blue-600 font-semibold text-white" : "text-gray-700"
              }`}
            >
              {format(day, "d")}
            </span>
          </button>
        ))}
      </div>

      {days.some((day) =>
        events.some((e) => e.allDay && e.start && isSameDay(parseISO(e.start), day)),
      ) && (
        <div className="mb-2 grid shrink-0 grid-cols-[3rem_repeat(7,1fr)] gap-px">
          <div />
          {days.map((day) => {
            const allDayEvents = events.filter(
              (e) => e.allDay && e.start && isSameDay(parseISO(e.start), day),
            );
            return (
              <div key={day.toISOString()} className="flex flex-col gap-1 px-1">
                {allDayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="truncate rounded-md px-2 py-1.5 text-left text-sm font-medium leading-tight text-white hover:brightness-95"
                    style={{ background: event.ownerColor }}
                    title={event.summary}
                  >
                    {event.summary}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="relative grid grid-cols-[3rem_repeat(7,1fr)]">
          <div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-t border-gray-100 pt-1 pr-2 text-right text-xs text-gray-400 first:border-t-0"
                style={{ height: HOUR_HEIGHT_PX }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => {
            const dayEvents = events.filter(
              (e) => !e.allDay && e.start && isSameDay(parseISO(e.start), day),
            );
            const daySelection =
              selection && selection.columnIndex === dayIndex ? selection : null;
            return (
              <div
                key={day.toISOString()}
                className="relative touch-none border-l border-gray-100 select-none"
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const slot = Math.floor((e.clientY - rect.top) / SLOT_HEIGHT_PX);
                  startSelection(dayIndex, slot);
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const slot = Math.min(
                    TOTAL_SLOTS - 1,
                    Math.max(0, Math.floor((e.clientY - rect.top) / SLOT_HEIGHT_PX)),
                  );
                  extendSelection(dayIndex, slot);
                }}
                onPointerUp={endSelection}
                onPointerCancel={cancelSelection}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-t border-gray-100 first:border-t-0"
                    style={{ height: HOUR_HEIGHT_PX }}
                  >
                    {dayEvents
                      .filter((e) => e.start && parseISO(e.start).getHours() === hour)
                      .map((event) => (
                        <button
                          key={event.id}
                          onClick={() => onSelectEvent(event)}
                          className="mx-0.5 mb-0.5 block w-[calc(100%-0.25rem)] truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight text-white hover:brightness-95"
                          style={{ background: event.ownerColor }}
                          title={event.summary}
                        >
                          {event.summary}
                        </button>
                      ))}
                  </div>
                ))}

                {daySelection && (
                  <div
                    className="pointer-events-none absolute inset-x-0 rounded border-2 border-blue-500 bg-blue-500/20"
                    style={{
                      top:
                        Math.min(daySelection.startSlot, daySelection.endSlot) *
                        SLOT_HEIGHT_PX,
                      height:
                        (Math.abs(daySelection.endSlot - daySelection.startSlot) + 1) *
                        SLOT_HEIGHT_PX,
                    }}
                  />
                )}

                {isToday(day) && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 h-px bg-red-500"
                    style={{ top: nowOffsetPx }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
