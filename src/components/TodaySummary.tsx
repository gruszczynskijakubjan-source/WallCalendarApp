"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { TodaySummary as TodaySummaryData } from "@/app/api/today-summary/route";

function useTodaySummary() {
  const [data, setData] = useState<TodaySummaryData | null>(null);

  useEffect(() => {
    fetch("/api/today-summary")
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return data;
}

export default function TodaySummary() {
  const data = useTodaySummary();
  if (!data) return null;

  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-3xl border border-border bg-surface p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Dziś w skrócie</h2>

      {data.events.length === 0 ? (
        <p className="text-sm text-foreground/50">Brak wydarzeń na dziś.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {data.events.map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-sm">
              <span className="w-12 shrink-0 text-foreground/50 tabular-nums">
                {e.allDay ? "Cały dz." : e.start ? format(parseISO(e.start), "HH:mm") : ""}
              </span>
              <span className="truncate">{e.summary}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-foreground/50">
        {data.activeTaskCount === 0
          ? "Brak aktywnych zadań 🎉"
          : `${data.activeTaskCount} aktywnych zadań`}
      </p>
    </div>
  );
}

/** Compact, semi-transparent variant meant to overlay full-bleed content (e.g. the photo slideshow). */
export function TodaySummaryOverlay() {
  const data = useTodaySummary();
  if (!data) return null;

  const visibleEvents = data.events.slice(0, 4);
  const overflow = data.events.length - visibleEvents.length;

  return (
    <div className="w-64 rounded-2xl bg-black/40 p-4 text-white backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-white/80">Dziś w skrócie</h2>

      {visibleEvents.length === 0 ? (
        <p className="mt-1 text-sm text-white/60">Brak wydarzeń na dziś.</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1">
          {visibleEvents.map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-sm">
              <span className="w-12 shrink-0 text-white/50 tabular-nums">
                {e.allDay ? "Cały dz." : e.start ? format(parseISO(e.start), "HH:mm") : ""}
              </span>
              <span className="truncate">{e.summary}</span>
            </li>
          ))}
          {overflow > 0 && (
            <li className="text-sm text-white/50">+{overflow} więcej</li>
          )}
        </ul>
      )}

      <p className="mt-1 text-sm text-white/60">
        {data.activeTaskCount === 0
          ? "Brak aktywnych zadań 🎉"
          : `${data.activeTaskCount} aktywnych zadań`}
      </p>
    </div>
  );
}
