"use client";

import { useState } from "react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

export default function NotificationSettings({
  initialPermission,
}: {
  initialPermission: PermissionState;
}) {
  const [permission, setPermission] = useState<PermissionState>(initialPermission);

  async function handleEnable() {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  const statusText: Record<PermissionState, string> = {
    default: "Wyłączone — kliknij, żeby zezwolić na powiadomienia.",
    granted: "Włączone — dostaniesz powiadomienie 15 minut przed każdym wydarzeniem.",
    denied: "Zablokowane w przeglądarce. Zmień to w ustawieniach witryny przeglądarki.",
    unsupported: "Ta przeglądarka nie obsługuje powiadomień.",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div>
        <p className="font-medium">Przypomnienia o wydarzeniach</p>
        <p className="text-sm text-foreground/50">{statusText[permission]}</p>
      </div>

      {permission === "default" && (
        <button
          type="button"
          onClick={handleEnable}
          className="rounded-full bg-accent-teal px-4 py-2 text-sm font-medium text-white hover:brightness-95"
        >
          Włącz
        </button>
      )}
    </div>
  );
}
