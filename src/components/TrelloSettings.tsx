"use client";

import { useEffect, useState } from "react";

type Config = {
  connected: boolean;
  boardId?: string | null;
  boardName?: string | null;
  listId?: string | null;
  listName?: string | null;
};

type Board = { id: string; name: string };
type List = { id: string; name: string };

export default function TrelloSettings() {
  const [config, setConfig] = useState<Config | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [token, setToken] = useState("");
  const [boards, setBoards] = useState<Board[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [selectedListId, setSelectedListId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadConfig() {
    fetch("/api/trello/config")
      .then((res) => res.json())
      .then((data: Config) => {
        setConfig(data);
        if (data.boardId) setSelectedBoardId(data.boardId);
        if (data.listId) setSelectedListId(data.listId);
      })
      .catch(() => setConfig({ connected: false }));
  }

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (!config?.connected) return;
    fetch("/api/trello/boards")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { boards: Board[] } | null) => setBoards(data?.boards ?? []))
      .catch(() => setBoards([]));
  }, [config?.connected]);

  useEffect(() => {
    if (!selectedBoardId) {
      setLists([]);
      return;
    }
    fetch(`/api/trello/boards/${selectedBoardId}/lists`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { lists: List[] } | null) => setLists(data?.lists ?? []))
      .catch(() => setLists([]));
  }, [selectedBoardId]);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/trello/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Błąd" }));
        throw new Error(body.error ?? "Nie udało się połączyć z Trello");
      }
      setApiKey("");
      setToken("");
      loadConfig();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveList() {
    const board = boards.find((b) => b.id === selectedBoardId);
    const list = lists.find((l) => l.id === selectedListId);
    if (!board || !list) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/trello/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId: board.id,
          boardName: board.name,
          listId: list.id,
          listName: list.name,
        }),
      });
      if (!res.ok) throw new Error("Nie udało się zapisać listy");
      loadConfig();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    setSaving(true);
    try {
      await fetch("/api/trello/config", { method: "DELETE" });
      setBoards([]);
      setLists([]);
      setSelectedBoardId("");
      setSelectedListId("");
      loadConfig();
    } finally {
      setSaving(false);
    }
  }

  if (!config) return null;

  if (!config.connected) {
    return (
      <form onSubmit={handleConnect} className="flex flex-col space-y-2">
        <p className="text-sm text-foreground/50">
          Klucz i token znajdziesz na{" "}
          <a
            href="https://trello.com/power-ups/admin"
            target="_blank"
            rel="noreferrer"
            className="text-accent-teal underline"
          >
            trello.com/power-ups/admin
          </a>
          .
        </p>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API Key"
          className="rounded-lg border border-border p-3 text-lg"
        />
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token"
          className="rounded-lg border border-border p-3 text-lg"
        />
        {error && <p className="text-sm text-accent-coral">{error}</p>}
        <button
          type="submit"
          disabled={saving || !apiKey || !token}
          className="self-start rounded-full bg-accent-teal px-5 py-2.5 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"
        >
          {saving ? "Łączenie…" : "Połącz z Trello"}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <div>
          <p className="font-medium">Połączono z Trello</p>
          <p className="text-sm text-foreground/50">
            {config.listName
              ? `Lista zakupów: ${config.boardName} → ${config.listName}`
              : "Wybierz tablicę i listę poniżej."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={saving}
          className="rounded-full px-3 py-1.5 text-sm text-foreground/50 hover:bg-surface-muted disabled:opacity-50"
        >
          Rozłącz
        </button>
      </div>

      <div className="flex space-x-2">
        <select
          value={selectedBoardId}
          onChange={(e) => {
            setSelectedBoardId(e.target.value);
            setSelectedListId("");
          }}
          className="flex-1 rounded-lg border border-border p-2 text-sm"
        >
          <option value="">Wybierz tablicę…</option>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={selectedListId}
          onChange={(e) => setSelectedListId(e.target.value)}
          disabled={!selectedBoardId}
          className="flex-1 rounded-lg border border-border p-2 text-sm disabled:opacity-50"
        >
          <option value="">Wybierz listę…</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSaveList}
          disabled={saving || !selectedListId}
          className="rounded-full bg-accent-teal px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"
        >
          Zapisz
        </button>
      </div>

      {error && <p className="text-sm text-accent-coral">{error}</p>}
    </div>
  );
}
