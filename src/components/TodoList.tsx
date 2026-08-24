"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { MergedTask } from "@/app/api/tasks/route";

type Account = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

const COMPLETED_PAGE_SIZE = 5;
const REFRESH_INTERVAL_MS = 60_000;

export default function TodoList() {
  const [tasks, setTasks] = useState<MergedTask[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreCompleted, setHasMoreCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterAccountId, setFilterAccountId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [tasksRes, accountsRes] = await Promise.all([
        fetch(`/api/tasks?completedLimit=${COMPLETED_PAGE_SIZE}`),
        fetch("/api/accounts"),
      ]);
      if (!tasksRes.ok) throw new Error("Nie udało się pobrać zadań");
      const tasksData = await tasksRes.json();
      const accountsData = await accountsRes.json();
      setTasks(tasksData.tasks);
      setHasMoreCompleted(tasksData.hasMoreCompleted);
      setAccounts(accountsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreCompleted = useCallback(async () => {
    setLoadingMore(true);
    try {
      const completedOffset = tasks.filter((t) => t.done).length;
      const res = await fetch(
        `/api/tasks?completedOffset=${completedOffset}&completedLimit=${COMPLETED_PAGE_SIZE}`,
      );
      if (!res.ok) throw new Error("Nie udało się pobrać kolejnych zadań");
      const data = await res.json();
      setTasks((prev) => [...prev, ...data.tasks]);
      setHasMoreCompleted(data.hasMoreCompleted);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setLoadingMore(false);
    }
  }, [tasks]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
    // Silent background refresh so tasks added/completed elsewhere show up
    // on this wall display without anyone needing to touch it.
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMoreCompleted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMoreCompleted();
        }
      },
      { root: sentinel.closest('[data-scroll-container="true"]'), rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreCompleted, loadingMore, loadMoreCompleted]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const accountId = newAccountId || accounts[0]?.id;
    if (!accountId) return;

    const title = newTitle.trim();
    setNewTitle("");
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, title }),
    });
    load();
  }

  async function toggleTask(task: MergedTask) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
    );
    await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    load();
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  const visibleTasks = filterAccountId
    ? tasks.filter((t) => t.accountId === filterAccountId)
    : tasks;

  return (
    <>
      <div className="flex shrink-0 flex-col gap-2 border-b border-border p-3">
        {accounts.length === 0 && !loading && (
          <p className="rounded-lg bg-accent-gold/15 p-3 text-xs text-foreground">
            Połącz konto Google w ustawieniach, żeby zobaczyć zadania z Google Tasks.
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-accent-coral/15 p-3 text-xs text-accent-coral">{error}</p>
        )}

        <form onSubmit={addTask} className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Dodaj zadanie…"
            className="flex-1 rounded-lg border border-border bg-background p-2 text-sm"
          />
          {accounts.length > 1 && (
            <div className="flex items-center gap-1.5">
              {accounts.map((a) => {
                const selected = (newAccountId || accounts[0]?.id) === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setNewAccountId(a.id)}
                    title={a.name ?? a.email ?? undefined}
                    className={`h-8 w-8 shrink-0 rounded-full ring-2 transition ${
                      selected ? "ring-accent-teal" : "ring-transparent hover:ring-border"
                    }`}
                  >
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.image}
                        alt={a.name ?? ""}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center rounded-full bg-surface-muted text-xs font-medium text-foreground/60">
                        {(a.name ?? a.email ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="submit"
            disabled={accounts.length === 0}
            suppressHydrationWarning
            className="rounded-full bg-accent-teal px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-40"
          >
            Dodaj
          </button>
        </form>

        {accounts.length > 1 && (
          <div className="flex gap-2">
            {accounts.map((a) => {
              const selected = filterAccountId === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setFilterAccountId(selected ? null : a.id)}
                  title={`Pokaż tylko zadania: ${a.name ?? a.email ?? ""}`}
                  aria-pressed={selected}
                  className={`h-7 w-7 shrink-0 rounded-full ring-2 transition ${
                    selected ? "ring-accent-teal" : "ring-transparent hover:ring-border"
                  }`}
                >
                  {a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.image}
                      alt={a.name ?? ""}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-surface-muted text-xs font-medium text-foreground/60">
                      {(a.name ?? a.email ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        data-scroll-container="true"
        className="min-h-0 flex-1 overflow-y-auto p-2"
      >
        {loading ? (
          <p className="p-4 text-foreground/50">Ładowanie…</p>
        ) : visibleTasks.length === 0 ? (
          <p className="p-4 text-foreground/50">
            {filterAccountId ? "Brak zadań dla tej osoby." : "Brak zadań 🎉"}
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {visibleTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-surface-muted"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={task.done}
                    aria-label={
                      task.done ? "Oznacz jako nieukończone" : "Oznacz jako ukończone"
                    }
                    title={task.ownerName ?? undefined}
                    onClick={() => toggleTask(task)}
                    className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 transition ${
                      task.done ? "ring-border hover:ring-foreground/30" : "ring-accent-teal"
                    }`}
                  >
                    {task.ownerImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={task.ownerImage}
                        alt={task.ownerName ?? ""}
                        className={`h-full w-full object-cover transition ${
                          task.done ? "opacity-40 grayscale" : ""
                        }`}
                      />
                    ) : (
                      <span
                        className={`flex h-full w-full items-center justify-center text-xs font-medium transition ${
                          task.done
                            ? "bg-surface-muted text-foreground/50 opacity-40"
                            : "bg-accent-teal text-white"
                        }`}
                      >
                        {(task.ownerName ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    {task.done && (
                      <span className="absolute inset-0 flex items-center justify-center bg-foreground/40">
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                          <path
                            d="M3 8.5L6.5 12L13 4.5"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${task.done ? "text-foreground/40 line-through" : ""}`}
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="rounded-full px-2 py-1 text-xs text-foreground/40 hover:bg-accent-coral/10 hover:text-accent-coral"
                  >
                    Usuń
                  </button>
                </li>
              ))}
            </ul>

            {hasMoreCompleted && (
              <div ref={sentinelRef} className="p-2 text-center text-xs text-foreground/40">
                {loadingMore ? "Ładowanie…" : ""}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
