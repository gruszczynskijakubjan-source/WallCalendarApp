import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { DailyForecast } from "@/app/api/weather/forecast/route";
import { getDeviceLocation } from "@/lib/deviceLocation";

/** Fetches the 14-day forecast once and exposes it keyed by yyyy-MM-dd. */
export function useForecastByDate() {
  const [forecast, setForecast] = useState<Record<string, DailyForecast>>({});

  useEffect(() => {
    const location = getDeviceLocation();
    const params = location ? `?lat=${location.lat}&lon=${location.lon}` : "";
    fetch(`/api/weather/forecast${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { forecast: DailyForecast[] } | null) => {
        if (!data) return;
        const byDate: Record<string, DailyForecast> = {};
        for (const day of data.forecast) byDate[day.date] = day;
        setForecast(byDate);
      })
      .catch(() => {});
  }, []);

  return forecast;
}

export function forecastKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}
