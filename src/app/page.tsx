import Link from "next/link";
import CalendarBoard from "@/components/CalendarBoard";
import TaskListPanel from "@/components/TaskListPanel";
import TodaySummary from "@/components/TodaySummary";
import EventReminders from "@/components/EventReminders";

export default function Home() {
  return (
    <main className="flex h-screen flex-col gap-4 bg-background p-4 md:p-6">
      <EventReminders />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
        <CalendarBoard />
        <div className="flex min-h-0 flex-col gap-4">
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
  );
}
