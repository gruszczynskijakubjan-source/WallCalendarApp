"use client";

import { useEffect, useState } from "react";
import { getDeviceLocation, type DeviceLocation } from "@/lib/deviceLocation";
import WeatherLocationSettings from "@/components/WeatherLocationSettings";

/**
 * localStorage only exists in the browser, so the server always renders
 * "disabled". This reads the real value right after mount, once, to avoid a
 * server/client hydration mismatch in the child.
 */
export default function WeatherLocationSettingsLoader() {
  const [initialLocation, setInitialLocation] = useState<DeviceLocation | null>(null);

  useEffect(() => {
    // localStorage is only available in the browser; reading it here (once,
    // on mount) avoids a server/client hydration mismatch in the child.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialLocation(getDeviceLocation());
  }, []);

  return <WeatherLocationSettings initialLocation={initialLocation} />;
}
