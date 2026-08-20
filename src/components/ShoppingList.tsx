"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { TrelloCard } from "@/pages/api/trello/cards";

const REFRESH_INTERVAL_MS = 60_000;

export default function ShoppingList() {
  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [configured, setConfigured] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/trello/cards");
      if (!res.ok) throw new Error("Nie udało się pobrać listy zakupów");
      const data = await res.json();
      setCards(data.cards);
      setConfigured(data.configured);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const name = newTitle.trim();
    setNewTitle("");
    await fetch("/api/trello/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    load();
  }

  async function toggleCard(card: TrelloCard) {
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, done: !c.done } : c)));
    await fetch(`/api/trello/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !card.done }),
    });
    load();
  }

  async function deleteCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/trello/cards/${id}`, { method: "DELETE" });
  }

  async function clearAll() {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    setClearing(true);
    setConfirmingClear(false);
    try {
      setCards([]);
      await fetch("/api/trello/cards", { method: "DELETE" });
      load();
    } finally {
      setClearing(false);
    }
  }

  const active = cards.filter((c) => !c.done);
  const done = cards.filter((c) => c.done);

  if (!loading && !configured) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-foreground/50">
        Skonfiguruj Trello i wybierz listę zakupów w{" "}
        <Link href="/settings" className="ml-1 text-accent-teal underline">
          Ustawieniach
        </Link>
        .
      </div>
    );
  }

  return (
    <>
      <div className="flex shrink-0 flex-col gap-2 border-b border-border p-3">
        {error && (
          <p className="rounded-lg bg-accent-coral/15 p-3 text-xs text-accent-coral">{error}</p>
        )}

        <form onSubmit={addCard} className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Dodaj produkt…"
            className="flex-1 rounded-lg border border-border bg-background p-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-accent-teal px-4 py-2 text-sm font-medium text-white hover:brightness-95"
          >
            Dodaj
          </button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="p-3 text-sm text-foreground/50">Ładowanie…</p>
        ) : cards.length === 0 ? (
          <p className="p-3 text-sm text-foreground/50">Lista zakupów jest pusta 🛒</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {[...active, ...done].map((card) => (
              <li
                key={card.id}
                className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-surface-muted"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={card.done}
                  aria-label={card.done ? "Oznacz jako niekupione" : "Oznacz jako kupione"}
                  onClick={() => toggleCard(card)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    card.done
                      ? "border-accent-teal bg-accent-teal text-white"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  {card.done && (
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                      <path
                        d="M3 8.5L6.5 12L13 4.5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${card.done ? "text-foreground/40 line-through" : ""}`}
                >
                  {card.name}
                </span>
                <button
                  onClick={() => deleteCard(card.id)}
                  className="rounded-full px-2 py-1 text-xs text-foreground/40 hover:bg-accent-coral/10 hover:text-accent-coral"
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        )}

        {cards.length > 0 && (
          <div className="flex justify-center pt-2">
            {confirmingClear && (
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="mr-2 rounded-full px-2.5 py-1 text-xs text-foreground/50 hover:bg-surface-muted"
              >
                Anuluj
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              disabled={clearing}
              className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                confirmingClear
                  ? "bg-accent-coral text-white hover:brightness-95"
                  : "text-foreground/50 hover:bg-accent-coral/10 hover:text-accent-coral"
              }`}
            >
              {clearing
                ? "Usuwanie…"
                : confirmingClear
                  ? "Na pewno usunąć wszystko?"
                  : "Wyczyść listę"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
