"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { WeatherResponse } from "@/app/api/weather/route";
import { getDeviceLocation } from "@/lib/deviceLocation";
import { weatherIcon } from "@/lib/weatherIcon";
import { describeAqi, aqiColor } from "@/lib/airQuality";
import { THEMES, type Theme } from "@/lib/theme";

function countdownLabel(now: Date, theme: Theme | null): string | null {
  if (theme === "newyear") {
    const target = new Date(now.getFullYear(), 11, 31, 24, 0, 0);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return "Szczęśliwego Nowego Roku! 🎉";
    const h = Math.floor(diffMs / 3_600_000);
    const m = Math.floor((diffMs % 3_600_000) / 60_000);
    return `Do Nowego Roku: ${h}godz. ${m}min.`;
  }
  if (theme === "christmas") {
    const target = new Date(now.getFullYear(), 11, 24, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
    if (diffDays < 0) return null;
    if (diffDays === 0) return "Dziś Wigilia! 🎄";
    return `Do Wigilii: ${diffDays} dni`;
  }
  return null;
}

export default function ClockWeatherWidget() {
  // Lazily initialized on the client only (this is a client component), so
  // the clock has a real value from the first render instead of null.
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    function sync() {
      const current = root.getAttribute("data-theme");
      setTheme((THEMES as readonly string[]).includes(current ?? "") ? (current as Theme) : null);
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
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

  const countdown = countdownLabel(now, theme);

  return (
    <div className="flex h-full items-center justify-center gap-4 rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm">
      <div className="flex-1 text-center" suppressHydrationWarning>
        <p className="text-2xl leading-none font-semibold tabular-nums">
          {format(now, "HH:mm")}
        </p>
        <p className="mt-0.5 text-xs text-foreground/50 capitalize">
          {format(now, "EEEE, d MMMM", { locale: pl })}
        </p>
        {countdown && (
          <p className="mt-0.5 text-xs font-medium text-accent-gold">{countdown}</p>
        )}
      </div>

      {weather && (
        <div className="flex flex-1 items-center justify-center gap-2.5 border-l border-border pl-4">
          <span className="text-2xl" aria-hidden>
            {weatherIcon(weather.weatherCode, weather.isDay)}
          </span>
          <div className="text-center">
            <p className="text-lg leading-none font-semibold tabular-nums">
              {Math.round(weather.temperatureC)}°C
            </p>
            {weather.label && (
              <p className="mt-0.5 text-xs text-foreground/50">{weather.label}</p>
            )}
            {weather.europeanAqi !== null && (
              <p
                className="mt-0.5 text-[11px] font-medium"
                style={{ color: aqiColor(weather.europeanAqi) }}
                title="Jakość powietrza (europejski AQI)"
              >
                Jakość Powietrza: {describeAqi(weather.europeanAqi)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
