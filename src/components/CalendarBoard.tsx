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

      setEvents(eventsData.events);
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

  function toggleAccount(accountId: string) {
    setActiveAccountIds((prev) => {
      // `null` means "everyone active"; expand it to an explicit set on first click.
      const base = prev ?? new Set(accounts.map((a) => a.id));
      const next = new Set(base);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      // If everyone ends up selected again, go back to the unfiltered "null" state.
      return next.size === accounts.length ? null : next;
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
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Otwórz panel kalendarzy"
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="flex h-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-8 py-4">
          <h1 className="text-3xl font-semibold whitespace-nowrap">Kalendarz Gruszków 🍐</h1>
        </div>
        <div className="min-w-64 flex-1">
          <ClockWeatherWidget />
        </div>
      </div>

      {accounts.length === 0 && !loading && (
        <p className="rounded-lg bg-amber-100 p-4 text-amber-900">
          Nie połączono jeszcze żadnego konta Google. Przejdź do{" "}
          <a href="/settings" className="underline font-medium">
            ustawień
          </a>{" "}
          aby połączyć swoje konto.
        </p>
      )}

      {error && <p className="rounded-lg bg-red-100 p-4 text-red-900">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Wstecz"
            className="rounded-full px-3 py-2 text-xl text-gray-500 hover:bg-gray-100"
          >
            ‹
          </button>
          {view === "day" && (
            <span className="text-lg font-medium">{cursorDate.getDate()}</span>
          )}
          <PeriodPicker
            showMonth={view === "day" || view === "week" || view === "month"}
            date={cursorDate}
            onChange={setCursorDate}
          />
          <button
            onClick={() => navigate(1)}
            aria-label="Dalej"
            className="rounded-full px-3 py-2 text-xl text-gray-500 hover:bg-gray-100"
          >
            ›
          </button>
          {isCustom && (
            <button
              onClick={goToday}
              className="ml-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Dziś
            </button>
          )}
        </div>

        <div className="flex rounded-full bg-gray-100 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                view === v.id
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="min-h-0 flex-1 touch-pan-y overflow-hidden rounded-2xl border border-gray-200 bg-white p-4"
        {...swipeHandlers}
      >
        {loading ? (
          <p className="p-6 text-gray-500">Ładowanie wydarzeń…</p>
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
        accounts={accounts}
        activeAccountIds={activeAccountIds}
        onToggleAccount={toggleAccount}
      />
    </section>
  );
}
