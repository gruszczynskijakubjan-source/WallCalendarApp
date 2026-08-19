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

export default function TodoList() {
  const [tasks, setTasks] = useState<MergedTask[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newAccountId, setNewAccountId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreCompleted, setHasMoreCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <h2 className="text-2xl font-semibold">Lista zadań</h2>

      {accounts.length === 0 && !loading && (
        <p className="rounded-lg bg-amber-100 p-4 text-sm text-amber-900">
          Połącz konto Google w ustawieniach, żeby zobaczyć zadania z Google Tasks.
        </p>
      )}

      {error && <p className="rounded-lg bg-red-100 p-4 text-sm text-red-900">{error}</p>}

      <form onSubmit={addTask} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Dodaj zadanie…"
            className="flex-1 rounded-lg border border-gray-300 p-3 text-lg"
          />
          <button
            type="submit"
            disabled={accounts.length === 0}
            className="rounded-full bg-blue-600 px-5 py-3 text-lg font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            Dodaj
          </button>
        </div>
        {accounts.length > 1 && (
          <div className="flex gap-2">
            {accounts.map((a) => {
              const selected = (newAccountId || accounts[0]?.id) === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setNewAccountId(a.id)}
                  title={a.name ?? a.email ?? undefined}
                  className={`h-8 w-8 shrink-0 rounded-full ring-2 transition ${
                    selected ? "ring-blue-600" : "ring-transparent hover:ring-gray-300"
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
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                      {(a.name ?? a.email ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </form>

      <div
        data-scroll-container="true"
        className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2"
      >
        {loading ? (
          <p className="p-4 text-gray-500">Ładowanie…</p>
        ) : tasks.length === 0 ? (
          <p className="p-4 text-gray-500">Brak zadań 🎉</p>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-4 rounded-xl p-4 hover:bg-gray-50"
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
                    className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 transition ${
                      task.done ? "ring-gray-300 hover:ring-gray-400" : "ring-blue-600"
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
                        className={`flex h-full w-full items-center justify-center text-sm font-medium transition ${
                          task.done
                            ? "bg-gray-200 text-gray-500 opacity-40"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {(task.ownerName ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    {task.done && (
                      <span className="absolute inset-0 flex items-center justify-center bg-gray-500/40">
                        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
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
                    className={`flex-1 text-xl ${task.done ? "text-gray-400 line-through" : ""}`}
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="rounded-full px-3 py-1 text-sm text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    Usuń
                  </button>
                </li>
              ))}
            </ul>

            {hasMoreCompleted && (
              <div ref={sentinelRef} className="p-3 text-center text-sm text-gray-400">
                {loadingMore ? "Ładowanie…" : ""}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
