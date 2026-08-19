import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { getCalendarClient, getTasksClient, getLinkedGoogleAccounts } from "@/lib/google";

export type TodaySummary = {
  events: { id: string; summary: string; start: string | null; allDay: boolean }[];
  activeTaskCount: number;
};

// GET /api/today-summary — today's events across all accounts + active task count.
export async function GET() {
  const accounts = await getLinkedGoogleAccounts();
  const timeMin = startOfDay(new Date()).toISOString();
  const timeMax = endOfDay(new Date()).toISOString();

  const results = await Promise.all(
    accounts.map(async (account) => {
      try {
        const [calendar, tasks] = await Promise.all([
          getCalendarClient(account.id),
          getTasksClient(account.id),
        ]);

        const eventsRes = await calendar.events.list({
          calendarId: "primary",
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 50,
        });

        const taskLists = await tasks.tasklists.list({ maxResults: 1 });
        const taskListId = taskLists.data.items?.[0]?.id;
        const tasksRes = taskListId
          ? await tasks.tasks.list({
              tasklist: taskListId,
              showCompleted: false,
              maxResults: 500,
            })
          : null;

        return {
          events: (eventsRes.data.items ?? []).map((e) => ({
            id: `${account.id}:${e.id}`,
            summary: e.summary ?? "(bez tytułu)",
            start: e.start?.dateTime ?? e.start?.date ?? null,
            allDay: Boolean(e.start?.date && !e.start?.dateTime),
          })),
          activeTaskCount: tasksRes?.data.items?.length ?? 0,
        };
      } catch (error) {
        console.error(`Failed to fetch today summary for account ${account.id}`, error);
        return { events: [], activeTaskCount: 0 };
      }
    }),
  );

  const summary: TodaySummary = {
    events: results
      .flatMap((r) => r.events)
      .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? "")),
    activeTaskCount: results.reduce((sum, r) => sum + r.activeTaskCount, 0),
  };

  return NextResponse.json(summary);
}
