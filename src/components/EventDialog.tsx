"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { MergedEvent } from "@/app/api/calendar/events/route";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4"
      >
        <h2 className="text-2xl font-semibold">
          {isEditing ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
        </h2>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600">Kalendarz</span>
          <select
            value={accountId}
            disabled={isEditing}
            onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
            className="rounded-lg border border-gray-300 p-3 text-lg disabled:bg-gray-100 disabled:text-gray-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.email}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600">Tytuł</span>
          <input
            required
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            className="rounded-lg border border-gray-300 p-3 text-lg"
            placeholder="np. Wizyta u lekarza"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600">Miejsce</span>
          <input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="rounded-lg border border-gray-300 p-3 text-lg"
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
          <span className="text-sm font-medium text-gray-600">Data</span>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="rounded-lg border border-gray-300 p-3 text-lg"
          />
        </label>

        {!form.allDay && (
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-gray-600">Od</span>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="rounded-lg border border-gray-300 p-3 text-lg"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-gray-600">Do</span>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="rounded-lg border border-gray-300 p-3 text-lg"
              />
            </label>
          </div>
        )}

        {error && <p className="text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-3 pt-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="rounded-full px-5 py-3 text-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
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
              className="rounded-full px-5 py-3 text-lg text-gray-600 hover:bg-gray-100"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting || deleting}
              className="rounded-full bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Zapisywanie…" : isEditing ? "Zapisz" : "Dodaj"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
