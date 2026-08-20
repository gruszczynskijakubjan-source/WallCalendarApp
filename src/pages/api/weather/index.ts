import type { NextApiRequest, NextApiResponse } from "next";

export type WeatherResponse = {
  temperatureC: number;
  weatherCode: number;
  isDay: boolean;
  label: string | null;
  europeanAqi: number | null;
};

// WMO weather codes -> short Polish description, used for the tooltip/aria-label.
const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Bezchmurnie",
  1: "Przeważnie bezchmurnie",
  2: "Częściowe zachmurzenie",
  3: "Zachmurzenie",
  45: "Mgła",
  48: "Mgła szadzi",
  51: "Mżawka słaba",
  53: "Mżawka",
  55: "Mżawka gęsta",
  61: "Słaby deszcz",
  63: "Deszcz",
  65: "Silny deszcz",
  71: "Słaby śnieg",
  73: "Śnieg",
  75: "Silny śnieg",
  80: "Przelotny deszcz",
  81: "Przelotny deszcz",
  82: "Silny przelotny deszcz",
  85: "Przelotny śnieg",
  86: "Silny przelotny śnieg",
  95: "Burza",
  96: "Burza z gradem",
  99: "Silna burza z gradem",
};

export function describeWeatherCode(code: number) {
  return WEATHER_DESCRIPTIONS[code] ?? "Pogoda";
}

// GET /api/weather?lat=..&lon=..&label=..
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const lat = (req.query.lat as string) ?? process.env.WEATHER_LAT;
  const lon = (req.query.lon as string) ?? process.env.WEATHER_LON;
  const label = (req.query.label as string) ?? process.env.WEATHER_LABEL ?? null;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Brak skonfigurowanej lokalizacji pogody" });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("timezone", "auto");

  const airQualityUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  airQualityUrl.searchParams.set("latitude", lat);
  airQualityUrl.searchParams.set("longitude", lon);
  airQualityUrl.searchParams.set("current", "european_aqi");

  const [weatherRes, airRes] = await Promise.all([fetch(url), fetch(airQualityUrl)]);
  if (!weatherRes.ok) {
    return res.status(502).json({ error: "Nie udało się pobrać pogody" });
  }

  const data = await weatherRes.json();
  const airData = airRes.ok ? await airRes.json() : null;

  const weather: WeatherResponse = {
    temperatureC: data.current.temperature_2m,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    label,
    europeanAqi: airData?.current?.european_aqi ?? null,
  };

  return res.status(200).json(weather);
}
