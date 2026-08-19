"use client";

import { useState } from "react";
import TodoList from "@/components/TodoList";
import ShoppingList from "@/components/ShoppingList";

type Tab = "tasks" | "shopping";

export default function TaskListPanel() {
  const [tab, setTab] = useState<Tab>("tasks");

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex shrink-0 items-center justify-between p-3 pb-0">
        <div className="flex rounded-full bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => setTab("tasks")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === "tasks"
                ? "bg-surface text-accent-teal shadow-sm"
                : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            Lista zadań
          </button>
          <button
            type="button"
            onClick={() => setTab("shopping")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === "shopping"
                ? "bg-surface text-accent-teal shadow-sm"
                : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            Lista zakupów
          </button>
        </div>
      </div>

      {tab === "tasks" ? <TodoList /> : <ShoppingList />}
    </section>
  );
}
