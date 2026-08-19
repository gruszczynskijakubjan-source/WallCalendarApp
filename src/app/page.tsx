"use client";

import Link from "next/link";
import CalendarBoard from "@/components/CalendarBoard";
import TaskListPanel from "@/components/TaskListPanel";
import TodaySummary from "@/components/TodaySummary";
import EventReminders from "@/components/EventReminders";
import ScaledViewport from "@/components/ScaledViewport";

export default function Home() {
  return (
    <ScaledViewport>
      {(portrait) => (
        <main className="flex h-full w-full flex-col gap-3 bg-background p-4">
          <EventReminders />
          <div
            className="grid min-h-0 flex-1 gap-3"
            style={{
              gridTemplateColumns: portrait ? "1fr" : "2fr 1fr",
            }}
          >
            <CalendarBoard />
            <div className="flex min-h-0 flex-col gap-3">
              <TodaySummary />
              <TaskListPanel />
            </div>
          </div>
          <footer className="flex justify-center">
            <Link
              href="/settings"
              className="text-sm text-foreground/40 hover:text-foreground/70"
            >
              Ustawienia
            </Link>
          </footer>
        </main>
      )}
    </ScaledViewport>
  );
}
