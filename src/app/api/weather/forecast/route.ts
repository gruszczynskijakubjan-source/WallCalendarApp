import { NextResponse } from "next/server";

export type DailyForecast = {
  date: string; // yyyy-MM-dd
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
};

// GET /api/weather/forecast?lat=..&lon=..
// Daily forecast for today + the next 13 days (Open-Meteo's max daily range).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat") ?? process.env.WEATHER_LAT;
  const lon = searchParams.get("lon") ?? process.env.WEATHER_LON;

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Brak skonfigurowanej lokalizacji pogody" },
      { status: 400 },
    );
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "14");
  url.searchParams.set("timezone", "auto");

  // Daily forecasts change slowly; refresh once an hour is plenty and keeps
  // this well within Open-Meteo's free-tier request budget.
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return NextResponse.json({ error: "Nie udało się pobrać prognozy" }, { status: 502 });
  }

  const data = await res.json();
  const daily = data.daily as {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };

  const forecast: DailyForecast[] = daily.time.map((date, i) => ({
    date,
    weatherCode: daily.weather_code[i],
    tempMaxC: daily.temperature_2m_max[i],
    tempMinC: daily.temperature_2m_min[i],
  }));

  return NextResponse.json({ forecast });
}
