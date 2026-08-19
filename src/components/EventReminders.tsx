"use client";

import { useEventReminders } from "@/lib/useEventReminders";

/** Invisible component that just runs the browser-notification reminder loop. */
export default function EventReminders() {
  useEventReminders();
  return null;
}
