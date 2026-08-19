"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { WeatherResponse } from "@/app/api/weather/route";
import { getDeviceLocation } from "@/lib/deviceLocation";

const WEATHER_ICONS: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  85: "🌨️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

function weatherIcon(code: number, isDay: boolean) {
  if (code === 0 || code === 1) return isDay ? "☀️" : "🌙";
  return WEATHER_ICONS[code] ?? "🌡️";
}

export default function ClockWeatherWidget() {
  // Lazily initialized on the client only (this is a client component), so
  // the clock has a real value from the first render instead of null.
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherResponse | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const location = getDeviceLocation();
    const params = location
      ? `?lat=${location.lat}&lon=${location.lon}&label=${encodeURIComponent("Twoja lokalizacja")}`
      : "";

    fetch(`/api/weather${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setWeather)
      .catch(() => setWeather(null));
  }, []);

  return (
    <div className="flex h-full items-center justify-center gap-8 rounded-2xl border border-gray-200 bg-white px-8 py-4">
      <div className="flex-1 text-center" suppressHydrationWarning>
        <p className="text-5xl leading-none font-semibold tabular-nums">
          {format(now, "HH:mm")}
        </p>
        <p className="mt-1 text-base text-gray-500 capitalize">
          {format(now, "EEEE, d MMMM", { locale: pl })}
        </p>
      </div>

      {weather && (
        <div className="flex flex-1 items-center justify-center gap-4 border-l border-gray-200 pl-8">
          <span className="text-5xl" aria-hidden>
            {weatherIcon(weather.weatherCode, weather.isDay)}
          </span>
          <div className="text-center">
            <p className="text-3xl leading-none font-semibold tabular-nums">
              {Math.round(weather.temperatureC)}°C
            </p>
            {weather.label && (
              <p className="mt-1 text-base text-gray-500">{weather.label}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
