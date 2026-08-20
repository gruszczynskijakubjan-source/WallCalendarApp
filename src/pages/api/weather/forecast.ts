import type { NextApiRequest, NextApiResponse } from "next";

export type DailyForecast = {
  date: string; // yyyy-MM-dd
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
};

// GET /api/weather/forecast?lat=..&lon=..
// Daily forecast for today + the next 13 days (Open-Meteo's max daily range).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const lat = (req.query.lat as string) ?? process.env.WEATHER_LAT;
  const lon = (req.query.lon as string) ?? process.env.WEATHER_LON;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Brak skonfigurowanej lokalizacji pogody" });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "14");
  url.searchParams.set("timezone", "auto");

  const forecastRes = await fetch(url);
  if (!forecastRes.ok) {
    return res.status(502).json({ error: "Nie udało się pobrać prognozy" });
  }

  const data = await forecastRes.json();
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

  return res.status(200).json({ forecast });
}
