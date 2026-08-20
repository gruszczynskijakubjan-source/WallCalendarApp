"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO, isSameDay, isToday, addMinutes } from "date-fns";
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

function slotToDate(date: Date, slot: number) {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addMinutes(base, slot * SLOT_MINUTES);
}

export default function DayView({
  date,
  events,
  onSelectEvent,
  onCreateEvent,
}: {
  date: Date;
  events: MergedEvent[];
  onSelectEvent: (event: MergedEvent) => void;
  onCreateEvent: (range: EventInitialRange) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const showsToday = isToday(date);

  const dayEvents = events.filter(
    (e) => e.start && isSameDay(parseISO(e.start), date),
  );
  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);

  const { selection, startSelection, extendSelection, endSelection, cancelSelection } =
    useTimeGridSelection((sel) => {
      const minSlot = Math.min(sel.startSlot, sel.endSlot);
      const maxSlot = Math.max(sel.startSlot, sel.endSlot) + 1;
      onCreateEvent({ start: slotToDate(date, minSlot), end: slotToDate(date, maxSlot) });
    });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const target = showsToday ? now : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8);
    const offsetMinutes = target.getHours() * 60 + target.getMinutes();
    scrollRef.current?.scrollTo({
      top: (offsetMinutes / 60) * HOUR_HEIGHT_PX - HOUR_HEIGHT_PX * 2,
      behavior: "instant",
    });
    // Only re-scroll when the displayed day changes, not on every clock tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const nowOffsetPx = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT_PX;

  const forecast = useForecastByDate();
  const dayForecast = forecast[forecastKey(date)];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-lg font-semibold capitalize text-foreground">
          {format(date, "EEEE, d MMMM yyyy", { locale: pl })}
        </h2>
        {dayForecast && (
          <span className="flex items-center space-x-2 rounded-full bg-surface-muted px-3 py-1.5 text-base font-medium text-foreground/70">
            <span className="text-xl leading-none">
              {weatherIcon(dayForecast.weatherCode)}
            </span>
            {Math.round(dayForecast.tempMaxC)}° / {Math.round(dayForecast.tempMinC)}°
          </span>
        )}
      </div>

      {allDayEvents.length > 0 && (
        <ul className="mb-2 flex shrink-0 flex-col space-y-1">
          {allDayEvents.map((event) => (
            <li key={event.id}>
              <button
                onClick={() => onSelectEvent(event)}
                className="flex w-full items-center space-x-3 rounded-xl bg-surface-muted p-3 text-left hover:bg-surface-muted"
              >
                {event.ownerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.ownerImage}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full object-cover ring-2"
                    style={{ boxShadow: `0 0 0 2px ${event.ownerColor}` }}
                  />
                ) : (
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: event.ownerColor }}
                  />
                )}
                <span className="flex-1 font-medium">{event.summary}</span>
                <span className="text-sm text-foreground/50">Cały dzień</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="relative flex">
          <div className="shrink-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-t border-border pt-1 pr-2 text-right text-xs text-foreground/40 first:border-t-0"
                style={{ height: HOUR_HEIGHT_PX, width: 64 }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          <div
            className="relative flex-1 touch-none select-none"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const slot = Math.floor((e.clientY - rect.top) / SLOT_HEIGHT_PX);
              startSelection(0, slot);
              // Safari 12 (iPadOS 12.5.x) has no Pointer Events API at all —
              // setPointerCapture doesn't exist there. It's an enhancement
              // (keeps drag-selection tracking the element under a fast
              // swipe), not a requirement, so just skip it when unavailable.
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const slot = Math.min(
                TOTAL_SLOTS - 1,
                Math.max(0, Math.floor((e.clientY - rect.top) / SLOT_HEIGHT_PX)),
              );
              extendSelection(0, slot);
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
                {timedEvents
                  .filter((e) => e.start && parseISO(e.start).getHours() === hour)
                  .map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className="mb-1 flex w-full items-center space-x-2 rounded-lg p-2 text-left text-sm hover:brightness-95"
                      style={{ background: `${event.ownerColor}1a` }}
                    >
                      {event.ownerImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={event.ownerImage}
                          alt=""
                          className="h-5 w-5 shrink-0 rounded-full object-cover"
                          style={{ boxShadow: `0 0 0 2px ${event.ownerColor}` }}
                        />
                      ) : (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: event.ownerColor }}
                        />
                      )}
                      <span className="flex-1">
                        <span className="font-medium">{event.summary}</span>
                        <span className="ml-2 text-foreground/50">
                          {format(parseISO(event.start!), "HH:mm")}
                        </span>
                      </span>
                    </button>
                  ))}
              </div>
            ))}

            {selection && (
              <div
                className="pointer-events-none absolute inset-x-0 rounded-lg border-2 border-accent-teal bg-accent-teal/20"
                style={{
                  top: Math.min(selection.startSlot, selection.endSlot) * SLOT_HEIGHT_PX,
                  height:
                    (Math.abs(selection.endSlot - selection.startSlot) + 1) * SLOT_HEIGHT_PX,
                }}
              />
            )}

            {showsToday && (
              <div
                className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                style={{ top: nowOffsetPx }}
              >
                <span className="ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-coral" />
                <span className="h-px flex-1 bg-accent-coral" />
              </div>
            )}
          </div>
        </div>
      </div>

      {dayEvents.length === 0 && (
        <p className="p-4 text-center text-foreground/40">Brak wydarzeń tego dnia.</p>
      )}
    </div>
  );
}
