"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EweLinkDevice } from "@/pages/api/ewelink/devices";

export default function DevicesPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [devices, setDevices] = useState<EweLinkDevice[]>([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/ewelink/devices")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { devices: EweLinkDevice[]; connected: boolean } | null) => {
        setDevices(data?.devices ?? []);
        setConnected(data?.connected ?? false);
      })
      .catch(() => setError("Nie udało się pobrać urządzeń"))
      .finally(() => setLoading(false));
  }, [open]);

  async function toggleDevice(device: EweLinkDevice) {
    if (device.on === null) return;
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, on: !d.on } : d)),
    );
    await fetch(`/api/ewelink/devices/${device.id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ on: !device.on }),
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Urządzenia domowe</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-full p-2 text-foreground/50 hover:bg-surface-muted"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="p-4 text-center text-foreground/50">Ładowanie…</p>
        ) : !connected ? (
          <p className="p-4 text-center text-sm text-foreground/50">
            Połącz konto eWeLink w{" "}
            <Link href="/settings" className="text-accent-teal underline">
              Ustawieniach
            </Link>
            .
          </p>
        ) : error ? (
          <p className="p-4 text-center text-sm text-accent-coral">{error}</p>
        ) : devices.length === 0 ? (
          <p className="p-4 text-center text-foreground/50">Brak urządzeń na koncie.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {devices.map((device) => (
              <li
                key={device.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    device.online ? "bg-accent-teal" : "bg-foreground/20"
                  }`}
                  title={device.online ? "Online" : "Offline"}
                />
                <span className="flex-1 font-medium">{device.name}</span>
                {device.on !== null && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={device.on}
                    onClick={() => toggleDevice(device)}
                    disabled={!device.online}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${
                      device.on ? "bg-accent-teal" : "bg-surface-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                        device.on ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
