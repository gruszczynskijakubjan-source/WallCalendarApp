const STORAGE_KEY = "device-weather-location";

export type DeviceLocation = { lat: number; lon: number };

export function getDeviceLocation(): DeviceLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat === "number" && typeof parsed.lon === "number") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setDeviceLocation(location: DeviceLocation | null) {
  if (location) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** Prompts the browser's geolocation permission and stores the result. */
export function requestDeviceLocation(): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Ta przeglądarka nie obsługuje geolokalizacji"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setDeviceLocation(location);
        resolve(location);
      },
      (error) => reject(new Error(error.message)),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  });
}
