"use client";

import { useEffect, useState, useCallback } from "react";

type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdBy?: { name: string | null } | null;
};

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/todos");
    const data = await res.json();
    setTodos(data.todos);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const title = newTitle.trim();
    setNewTitle("");
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    load();
  }

  async function toggleTodo(todo: Todo) {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)),
    );
    await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !todo.done }),
    });
    load();
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  }

  return (
    <section className="flex h-full flex-col gap-4">
      <h2 className="text-2xl font-semibold">Lista zadań</h2>

      <form onSubmit={addTodo} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Dodaj zadanie…"
          className="flex-1 rounded-lg border border-gray-300 p-3 text-lg"
        />
        <button
          type="submit"
          className="rounded-full bg-blue-600 px-5 py-3 text-lg font-medium text-white hover:bg-blue-700"
        >
          Dodaj
        </button>
      </form>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2">
        {loading ? (
          <p className="p-4 text-gray-500">Ładowanie…</p>
        ) : todos.length === 0 ? (
          <p className="p-4 text-gray-500">Brak zadań 🎉</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo)}
                  className="h-6 w-6 shrink-0"
                />
                <span
                  className={`flex-1 text-lg ${
                    todo.done ? "text-gray-400 line-through" : ""
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="rounded-full px-3 py-1 text-sm text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
