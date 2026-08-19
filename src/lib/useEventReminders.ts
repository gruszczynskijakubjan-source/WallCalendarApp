import { useEffect, useRef, useState } from "react";
import type { TodaySummary } from "@/app/api/today-summary/route";

const REMINDER_MINUTES_BEFORE = 15;
const CHECK_INTERVAL_MS = 30_000;
const REFRESH_INTERVAL_MS = 5 * 60_000;

/**
 * Shows a browser notification ~15 minutes before each of today's timed
 * events starts. Requires Notification permission (requested separately,
 * e.g. in Settings). Purely client-side — no server cost beyond the
 * already-existing /api/today-summary endpoint.
 */
export function useEventReminders() {
  const notifiedRef = useRef(new Set<string>());
  const [events, setEvents] = useState<TodaySummary["events"]>([]);

  useEffect(() => {
    function refresh() {
      fetch("/api/today-summary")
        .then((res) => (res.ok ? res.json() : null))
        .then((data: TodaySummary | null) => setEvents(data?.events ?? []))
        .catch(() => {});
    }
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof Notification === "undefined") return;

    function check() {
      if (Notification.permission !== "granted") return;
      const now = Date.now();

      for (const event of events) {
        if (event.allDay || !event.start) continue;
        if (notifiedRef.current.has(event.id)) continue;

        const startMs = new Date(event.start).getTime();
        const minutesUntilStart = (startMs - now) / 60_000;

        if (minutesUntilStart <= REMINDER_MINUTES_BEFORE && minutesUntilStart > 0) {
          notifiedRef.current.add(event.id);
          new Notification(event.summary, {
            body: `Zaczyna się o ${new Date(startMs).toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            tag: event.id,
          });
        }
      }
    }

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [events]);
}
