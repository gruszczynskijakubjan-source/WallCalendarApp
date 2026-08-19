"use client";

import { useState } from "react";
import {
  requestDeviceLocation,
  setDeviceLocation,
  type DeviceLocation,
} from "@/lib/deviceLocation";

export default function WeatherLocationSettings({
  initialLocation,
}: {
  initialLocation: DeviceLocation | null;
}) {
  const [location, setLocation] = useState<DeviceLocation | null>(initialLocation);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEnable() {
    setLoading(true);
    setError(null);
    try {
      const loc = await requestDeviceLocation();
      setLocation(loc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać lokalizacji");
    } finally {
      setLoading(false);
    }
  }

  function handleDisable() {
    setDeviceLocation(null);
    setLocation(null);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
      <div>
        <p className="font-medium">Pogoda dla lokalizacji tego urządzenia</p>
        <p className="text-sm text-gray-500">
          {location
            ? `Włączone (${location.lat.toFixed(2)}, ${location.lon.toFixed(2)})`
            : "Wyłączone — widget pogody pokazuje domyślną lokalizację z konfiguracji serwera."}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {location ? (
        <button
          type="button"
          onClick={handleDisable}
          className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Wyłącz
        </button>
      ) : (
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Pobieranie…" : "Włącz"}
        </button>
      )}
    </div>
  );
}
