import { NextResponse } from "next/server";

export type WeatherResponse = {
  temperatureC: number;
  weatherCode: number;
  isDay: boolean;
  label: string | null;
  europeanAqi: number | null;
};

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

  const airQualityUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  airQualityUrl.searchParams.set("latitude", lat);
  airQualityUrl.searchParams.set("longitude", lon);
  airQualityUrl.searchParams.set("current", "european_aqi");

  const [res, airRes] = await Promise.all([
    fetch(url, { next: { revalidate: 600 } }),
    fetch(airQualityUrl, { next: { revalidate: 3600 } }),
  ]);
  if (!res.ok) {
    return NextResponse.json({ error: "Nie udało się pobrać pogody" }, { status: 502 });
  }

  const data = await res.json();
  const airData = airRes.ok ? await airRes.json() : null;

  const weather: WeatherResponse = {
    temperatureC: data.current.temperature_2m,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    label,
    europeanAqi: airData?.current?.european_aqi ?? null,
  };

  return NextResponse.json(weather);
}
