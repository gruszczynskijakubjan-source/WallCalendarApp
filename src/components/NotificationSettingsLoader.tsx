"use client";

import { useEffect, useState } from "react";
import NotificationSettings from "@/components/NotificationSettings";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

/**
 * The Notification API only exists in the browser, so the server always
 * renders "default". This reads the real permission right after mount, once,
 * to avoid a server/client hydration mismatch in the child.
 */
export default function NotificationSettingsLoader() {
  const [initialPermission, setInitialPermission] = useState<PermissionState>("default");

  useEffect(() => {
    const value =
      typeof Notification === "undefined" ? "unsupported" : Notification.permission;
    setInitialPermission(value);
  }, []);

  return <NotificationSettings initialPermission={initialPermission} />;
}
