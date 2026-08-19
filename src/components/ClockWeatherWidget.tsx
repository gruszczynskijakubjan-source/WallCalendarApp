"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { WeatherResponse } from "@/app/api/weather/route";
import { getDeviceLocation } from "@/lib/deviceLocation";
import { weatherIcon } from "@/lib/weatherIcon";
import { describeAqi, aqiColor } from "@/lib/airQuality";

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
    <div className="flex h-full items-center justify-center gap-4 rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm">
      <div className="flex-1 text-center" suppressHydrationWarning>
        <p className="text-2xl leading-none font-semibold tabular-nums">
          {format(now, "HH:mm")}
        </p>
        <p className="mt-0.5 text-xs text-foreground/50 capitalize">
          {format(now, "EEEE, d MMMM", { locale: pl })}
        </p>
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
