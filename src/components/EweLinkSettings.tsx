"use client";

import { useEffect, useState } from "react";

export default function EweLinkSettings() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  function loadStatus() {
    fetch("/api/ewelink/status")
      .then((res) => res.json())
      .then((data: { connected: boolean }) => setConnected(data.connected))
      .catch(() => setConnected(false));
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/ewelink/status", { method: "DELETE" });
      loadStatus();
    } finally {
      setDisconnecting(false);
    }
  }

  if (connected === null) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div>
        <p className="font-medium">Konto eWeLink</p>
        <p className="text-sm text-foreground/50">
          {connected
            ? "Połączono — urządzenia dostępne w panelu bocznym."
            : "Nie połączono."}
        </p>
      </div>

      {connected ? (
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="rounded-full px-4 py-2 text-sm font-medium text-foreground/50 hover:bg-surface-muted disabled:opacity-50"
        >
          Rozłącz
        </button>
      ) : (
        /* eslint-disable-next-line @next/next/no-html-link-for-pages -- this
           is an OAuth kickoff redirect (API route), not a Next.js page route. */
        <a
          href="/api/ewelink/connect"
          className="rounded-full bg-accent-teal px-4 py-2 text-sm font-medium text-white hover:brightness-95"
        >
          Połącz z eWeLink
        </a>
      )}
    </div>
  );
}
