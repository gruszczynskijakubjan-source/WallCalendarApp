"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { addDays, addWeeks, addMonths, addYears, isToday } from "date-fns";
import type { MergedEvent } from "@/app/api/calendar/events/route";
import EventDialog, { type EventInitialRange } from "@/components/EventDialog";
import DayView from "@/components/calendar/DayView";
import WeekView from "@/components/calendar/WeekView";
import MonthView from "@/components/calendar/MonthView";
import YearView from "@/components/calendar/YearView";
import { getRangeForView, type CalendarView } from "@/lib/calendarRange";
import { useSwipe } from "@/lib/useSwipe";
import PeriodPicker from "@/components/calendar/PeriodPicker";
import ClockWeatherWidget from "@/components/ClockWeatherWidget";
import AccountSidebar from "@/components/AccountSidebar";
import KitchenTimer from "@/components/KitchenTimer";
import PhotoSlideshow from "@/components/PhotoSlideshow";
import DevicesPanel from "@/components/DevicesPanel";
import {
  getHolidayEventsInRange,
  HOLIDAYS_ACCOUNT_ID,
  HOLIDAYS_ACCOUNT_COLOR,
} from "@/lib/polishHolidays";

type Account = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "day", label: "Dzień" },
  { id: "week", label: "Tydzień" },
  { id: "month", label: "Miesiąc" },
  { id: "year", label: "Rok" },
];

const DEFAULT_VIEW: CalendarView = "month";

export default function CalendarBoard() {
  const [view, setView] = useState<CalendarView>(DEFAULT_VIEW);
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [events, setEvents] = useState<MergedEvent[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type DialogState =
    | { mode: "edit"; event: MergedEvent }
    | { mode: "new"; initialRange?: EventInitialRange };
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [activeAccountIds, setActiveAccountIds] = useState<Set<string> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);

  const { start, end } = useMemo(
    () => getRangeForView(view, cursorDate),
    [view, cursorDate],
  );

  const isCustom = !isToday(cursorDate) || view !== DEFAULT_VIEW;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, accountsRes] = await Promise.all([
        fetch(
          `/api/calendar/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}`,
        ),
        fetch("/api/accounts"),
      ]);

      if (!eventsRes.ok) throw new Error("Nie udało się pobrać wydarzeń");
      const eventsData = await eventsRes.json();
      const accountsData = await accountsRes.json();

      setEvents([...eventsData.events, ...getHolidayEventsInRange(start, end)]);
      setAccounts(accountsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  function goToday() {
    setView(DEFAULT_VIEW);
    setCursorDate(new Date());
  }

  function navigate(direction: 1 | -1) {
    setCursorDate((prev) => {
      if (view === "day") return addDays(prev, direction);
      if (view === "week") return addWeeks(prev, direction);
      if (view === "month") return addMonths(prev, direction);
      return addYears(prev, direction);
    });
  }

  function handleSelectDay(day: Date) {
    setCursorDate(day);
    setView("day");
  }

  const sidebarAccounts = useMemo(
    () => [
      ...accounts,
      {
        id: HOLIDAYS_ACCOUNT_ID,
        name: "Święta w Polsce",
        email: null,
        image: null,
        color: HOLIDAYS_ACCOUNT_COLOR,
      },
    ],
    [accounts],
  );

  function toggleAccount(accountId: string) {
    setActiveAccountIds((prev) => {
      // `null` means "everyone active"; expand it to an explicit set on first click.
      const base = prev ?? new Set(sidebarAccounts.map((a) => a.id));
      const next = new Set(base);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      // If everyone ends up selected again, go back to the unfiltered "null" state.
      return next.size === sidebarAccounts.length ? null : next;
    });
  }

  const visibleEvents = useMemo(
    () =>
      activeAccountIds === null
        ? events
        : events.filter((e) => activeAccountIds.has(e.accountId)),
    [events, activeAccountIds],
  );

  const swipeHandlers = useSwipe(
    () => navigate(1),
    () => navigate(-1),
  );


  return (
    <section className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Otwórz panel kalendarzy"
          className="rounded-full p-2 text-foreground/50 hover:bg-surface-muted"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm">
          <h1 className="text-lg font-semibold whitespace-nowrap sm:text-xl">
            Kalendarz Gruszków 🍐
          </h1>
        </div>
        <div className="min-w-0 flex-1">
          <ClockWeatherWidget />
        </div>
      </div>

      {accounts.length === 0 && !loading && (
        <p className="rounded-2xl bg-accent-gold/15 p-4 text-foreground">
          Nie połączono jeszcze żadnego konta Google. Przejdź do{" "}
          <a href="/settings" className="underline font-medium">
            ustawień
          </a>{" "}
          aby połączyć swoje konto.
        </p>
      )}

      {error && (
        <p className="rounded-2xl bg-accent-coral/15 p-4 text-accent-coral">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            aria-label="Wstecz"
            className="rounded-full px-2.5 py-1.5 text-lg text-foreground/50 hover:bg-surface-muted"
          >
            ‹
          </button>
          {view === "day" && (
            <span className="text-sm font-medium">{cursorDate.getDate()}</span>
          )}
          <PeriodPicker
            showMonth={view === "day" || view === "week" || view === "month"}
            date={cursorDate}
            onChange={setCursorDate}
          />
          <button
            onClick={() => navigate(1)}
            aria-label="Dalej"
            className="rounded-full px-2.5 py-1.5 text-lg text-foreground/50 hover:bg-surface-muted"
          >
            ›
          </button>
          {isCustom && (
            <button
              onClick={goToday}
              className="ml-1 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-border"
            >
              Dziś
            </button>
          )}
        </div>

        <div className="flex rounded-full bg-surface-muted p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                view === v.id
                  ? "bg-surface text-accent-teal shadow-sm"
                  : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="min-h-0 flex-1 touch-pan-y overflow-hidden rounded-2xl border border-border bg-surface p-3 shadow-sm"
        {...swipeHandlers}
      >
        {loading ? (
          <p className="p-6 text-foreground/50">Ładowanie wydarzeń…</p>
        ) : view === "day" ? (
          <DayView
            date={cursorDate}
            events={visibleEvents}
            onSelectEvent={(event) => setDialogState({ mode: "edit", event })}
            onCreateEvent={(initialRange) => setDialogState({ mode: "new", initialRange })}
          />
        ) : view === "week" ? (
          <WeekView
            date={cursorDate}
            events={visibleEvents}
            onSelectDay={handleSelectDay}
            onSelectEvent={(event) => setDialogState({ mode: "edit", event })}
            onCreateEvent={(initialRange) => setDialogState({ mode: "new", initialRange })}
          />
        ) : view === "month" ? (
          <MonthView
            date={cursorDate}
            events={visibleEvents}
            onSelectDay={handleSelectDay}
            onSelectEvent={(event) => setDialogState({ mode: "edit", event })}
            onCreateEvent={(initialRange) => setDialogState({ mode: "new", initialRange })}
          />
        ) : (
          <YearView date={cursorDate} events={visibleEvents} onSelectDay={handleSelectDay} />
        )}
      </div>

      <EventDialog
        open={dialogState !== null}
        accounts={accounts}
        event={dialogState?.mode === "edit" ? dialogState.event : null}
        initialRange={dialogState?.mode === "new" ? dialogState.initialRange : undefined}
        onClose={() => setDialogState(null)}
        onSaved={() => {
          setDialogState(null);
          load();
        }}
        onDeleted={() => {
          setDialogState(null);
          load();
        }}
      />

      <AccountSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        accounts={sidebarAccounts}
        activeAccountIds={activeAccountIds}
        onToggleAccount={toggleAccount}
        onOpenSlideshow={() => setSlideshowOpen(true)}
        onOpenTimer={() => setTimerOpen(true)}
        onOpenDevices={() => setDevicesOpen(true)}
      />

      <KitchenTimer open={timerOpen} onClose={() => setTimerOpen(false)} />

      <PhotoSlideshow open={slideshowOpen} onClose={() => setSlideshowOpen(false)} />

      <DevicesPanel open={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </section>
  );
}
