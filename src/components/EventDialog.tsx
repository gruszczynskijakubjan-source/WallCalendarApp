"use client";

import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { MergedEvent } from "@/pages/api/calendar/events";
import { HOLIDAYS_ACCOUNT_ID } from "@/lib/polishHolidays";

type Account = {
  id: string;
  name: string | null;
  email: string | null;
};

export type EventInitialRange = { start: Date; end: Date; allDay?: boolean };

function toFormState(event: MergedEvent | null, initialRange?: EventInitialRange) {
  const now = new Date();
  const start = event?.start
    ? new Date(event.start)
    : (initialRange?.start ?? now);
  const end = event?.end
    ? new Date(event.end)
    : (initialRange?.end ?? new Date(now.getTime() + 60 * 60 * 1000));

  return {
    accountId: event?.accountId ?? "",
    summary: event?.summary ?? "",
    location: event?.location ?? "",
    date: format(start, "yyyy-MM-dd"),
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
    allDay: event?.allDay ?? initialRange?.allDay ?? false,
  };
}

export default function EventDialog({
  open,
  accounts,
  event,
  initialRange,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  accounts: Account[];
  /** Event being edited, or null when creating a new one. */
  event: MergedEvent | null;
  /** Prefilled date/time range when creating a new event from a drag selection. */
  initialRange?: EventInitialRange;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  if (!open) return null;

  return (
    <EventDialogForm
      // Remounts (and resets its internal form state) whenever a different
      // event is opened, instead of syncing it via an effect.
      key={event?.id ?? initialRange?.start.toISOString() ?? "new"}
      accounts={accounts}
      event={event}
      initialRange={initialRange}
      onClose={onClose}
      onSaved={onSaved}
      onDeleted={onDeleted}
    />
  );
}

function EventDialogForm({
  accounts,
  event,
  initialRange,
  onClose,
  onSaved,
  onDeleted,
}: {
  accounts: Account[];
  event: MergedEvent | null;
  initialRange?: EventInitialRange;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const isEditing = event !== null;
  const isReadOnly = event?.accountId === HOLIDAYS_ACCOUNT_ID;
  const [form, setForm] = useState(() => toFormState(event, initialRange));
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountId = form.accountId || accounts[0]?.id || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!accountId) throw new Error("Brak połączonego konta");

      const start = form.allDay ? form.date : `${form.date}T${form.startTime}:00`;
      const end = form.allDay ? form.date : `${form.date}T${form.endTime}:00`;

      const payload = {
        accountId,
        summary: form.summary,
        location: form.location,
        start,
        end,
        allDay: form.allDay,
      };

      const res = isEditing
        ? await fetch(`/api/calendar/events/${encodeURIComponent(event.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error("Nie udało się zapisać wydarzenia");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/events/${encodeURIComponent(event.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Nie udało się usunąć wydarzenia");
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setDeleting(false);
    }
  }

  if (isReadOnly && event) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl bg-surface p-6 shadow-xl">
          <h2 className="text-2xl font-semibold">{event.summary}</h2>
          <p className="text-foreground/60">
            {event.start &&
              format(new Date(event.start), "d MMMM yyyy", { locale: pl })}
          </p>
          <p className="text-sm text-foreground/40">
            Święto narodowe — tego wpisu nie można edytować ani usunąć.
          </p>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-surface-muted px-5 py-3 text-lg font-medium hover:bg-border"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl flex flex-col gap-4"
      >
        <h2 className="text-2xl font-semibold">
          {isEditing ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
        </h2>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground/60">Kalendarz</span>
          <select
            value={accountId}
            disabled={isEditing}
            onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
            className="rounded-lg border border-border p-3 text-lg disabled:bg-surface-muted disabled:text-foreground/40"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.email}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground/60">Tytuł</span>
          <input
            required
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            className="rounded-lg border border-border p-3 text-lg"
            placeholder="np. Wizyta u lekarza"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground/60">Miejsce</span>
          <input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="rounded-lg border border-border p-3 text-lg"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))}
            className="h-5 w-5"
          />
          <span>Cały dzień</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground/60">Data</span>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="rounded-lg border border-border p-3 text-lg"
          />
        </label>

        {!form.allDay && (
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-foreground/60">Od</span>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="rounded-lg border border-border p-3 text-lg"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-foreground/60">Do</span>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="rounded-lg border border-border p-3 text-lg"
              />
            </label>
          </div>
        )}

        {error && <p className="text-accent-coral">{error}</p>}

        <div className="flex items-center justify-between gap-3 pt-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="rounded-full px-5 py-3 text-lg text-accent-coral hover:bg-accent-coral/10 disabled:opacity-50"
            >
              {deleting ? "Usuwanie…" : "Usuń"}
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-3 text-lg text-foreground/60 hover:bg-surface-muted"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting || deleting}
              className="rounded-full bg-accent-teal px-6 py-3 text-lg font-medium text-white hover:brightness-95 disabled:opacity-50"
            >
              {submitting ? "Zapisywanie…" : isEditing ? "Zapisz" : "Dodaj"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
