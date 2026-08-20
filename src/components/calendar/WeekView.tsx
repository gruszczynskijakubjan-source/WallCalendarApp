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
import type { MergedEvent } from "@/pages/api/calendar/events";
import type { EventInitialRange } from "@/components/EventDialog";
import { useTimeGridSelection } from "@/lib/useTimeGridSelection";
import { useForecastByDate, forecastKey } from "@/lib/useForecast";
import { weatherIcon } from "@/lib/weatherIcon";

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

  const { selection, armed, startSelection, extendSelection, endSelection, cancelSelection } =
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
    const offsetMinutes = now.getHours() * 60 + now.getMinutes();
    const container = scrollRef.current;
    const viewportHeight = container?.clientHeight ?? HOUR_HEIGHT_PX * 4;
    container?.scrollTo({
      top: (offsetMinutes / 60) * HOUR_HEIGHT_PX - viewportHeight / 2,
      behavior: "instant",
    });
    // Only re-scroll when the displayed week changes, not on every clock tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.getTime()]);

  const nowOffsetPx = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT_PX;

  const forecast = useForecastByDate();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-2 grid shrink-0 grid-cols-[3rem_repeat(7,1fr)] gap-px">
        <div />
        {days.map((day) => {
          const dayForecast = forecast[forecastKey(day)];
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className="flex flex-col items-center space-y-0.5 rounded-lg py-1 hover:bg-surface-muted"
            >
              <span className="text-xs font-medium text-foreground/40 capitalize">
                {format(day, "EEE", { locale: pl })}
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  isToday(day) ? "bg-accent-coral font-semibold text-white" : "text-foreground"
                }`}
              >
                {format(day, "d")}
              </span>
              {dayForecast && (
                <span className="flex items-center space-x-0.5 text-xs text-foreground/60">
                  <span className="leading-none">{weatherIcon(dayForecast.weatherCode)}</span>
                  {Math.round(dayForecast.tempMaxC)}°
                </span>
              )}
            </button>
          );
        })}
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
              <div key={day.toISOString()} className="flex min-w-0 flex-col space-y-1 px-1">
                {allDayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="flex min-w-0 items-center space-x-1.5 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm font-medium leading-tight text-white hover:brightness-95"
                    style={{ background: event.ownerColor }}
                    title={event.summary}
                  >
                    {event.ownerImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.ownerImage}
                        alt=""
                        className="h-4 w-4 shrink-0 rounded-full object-cover ring-1 ring-white/60"
                      />
                    )}
                    <span className="truncate">{event.summary}</span>
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
                className="border-t border-border pt-1 pr-2 text-right text-xs text-foreground/40 first:border-t-0"
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
                className={`relative border-l border-border select-none ${armed ? "touch-none" : ""}`}
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const slot = Math.floor((e.clientY - rect.top) / SLOT_HEIGHT_PX);
                  startSelection(dayIndex, slot, { x: e.clientX, y: e.clientY });
                }}
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const slot = Math.min(
                    TOTAL_SLOTS - 1,
                    Math.max(0, Math.floor((e.clientY - rect.top) / SLOT_HEIGHT_PX)),
                  );
                  extendSelection(dayIndex, slot, { x: e.clientX, y: e.clientY });
                }}
                onPointerUp={endSelection}
                onPointerCancel={cancelSelection}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-t border-border first:border-t-0"
                    style={{ height: HOUR_HEIGHT_PX }}
                  >
                    {dayEvents
                      .filter((e) => e.start && parseISO(e.start).getHours() === hour)
                      .map((event) => (
                        <button
                          key={event.id}
                          onClick={() => onSelectEvent(event)}
                          className="mx-0.5 mb-0.5 flex w-[calc(100%-0.25rem)] items-center space-x-1 truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight text-white hover:brightness-95"
                          style={{ background: event.ownerColor }}
                          title={event.summary}
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
                  </div>
                ))}

                {daySelection && (
                  <div
                    className="pointer-events-none absolute inset-x-0 rounded border-2 border-accent-teal bg-accent-teal/20"
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
                    className="pointer-events-none absolute inset-x-0 z-10 h-px bg-accent-coral"
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
