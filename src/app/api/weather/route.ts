import { NextResponse } from "next/server";

export type WeatherResponse = {
  temperatureC: number;
  weatherCode: number;
  isDay: boolean;
  label: string | null;
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
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat") ?? process.env.WEATHER_LAT;
  const lon = searchParams.get("lon") ?? process.env.WEATHER_LON;
  const label = searchParams.get("label") ?? process.env.WEATHER_LABEL ?? null;

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Brak skonfigurowanej lokalizacji pogody" },
      { status: 400 },
    );
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) {
    return NextResponse.json({ error: "Nie udało się pobrać pogody" }, { status: 502 });
  }

  const data = await res.json();

  const weather: WeatherResponse = {
    temperatureC: data.current.temperature_2m,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    label,
  };

  return NextResponse.json(weather);
}
