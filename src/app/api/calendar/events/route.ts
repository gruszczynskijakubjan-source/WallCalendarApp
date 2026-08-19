import { NextResponse } from "next/server";
import { getCalendarClient, getLinkedGoogleAccounts } from "@/lib/google";

export type MergedEvent = {
  id: string;
  accountId: string;
  ownerName: string | null;
  ownerColor: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  start: string | null;
  end: string | null;
  allDay: boolean;
};

// Fallback palette, used only if Google's own colors can't be resolved.
const FALLBACK_OWNER_COLORS = ["#2563eb", "#db2777", "#16a34a", "#ea580c"];

// GET /api/calendar/events?timeMin=...&timeMax=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get("timeMin") ?? new Date().toISOString();
  const timeMax =
    searchParams.get("timeMax") ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const accounts = await getLinkedGoogleAccounts();

  const results = await Promise.all(
    accounts.map(async (account, index) => {
      const fallbackColor = FALLBACK_OWNER_COLORS[index % FALLBACK_OWNER_COLORS.length];
      try {
        const calendar = await getCalendarClient(account.id);

        const [colorsRes, calendarListRes, eventsRes] = await Promise.all([
          calendar.colors.get(),
          calendar.calendarList.get({ calendarId: "primary" }),
          calendar.events.list({
            calendarId: "primary",
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 250,
          }),
        ]);

        const eventColors = colorsRes.data.event ?? {};
        const calendarColor =
          calendarListRes.data.backgroundColor ?? fallbackColor;

        return (eventsRes.data.items ?? []).map((event): MergedEvent => {
          const overrideColor = event.colorId
            ? eventColors[event.colorId]?.background
            : undefined;

          return {
            id: `${account.id}:${event.id}`,
            accountId: account.id,
            ownerName: account.user.name,
            ownerColor: overrideColor ?? calendarColor,
            summary: event.summary ?? "(bez tytułu)",
            description: event.description,
            location: event.location,
            start: event.start?.dateTime ?? event.start?.date ?? null,
            end: event.end?.dateTime ?? event.end?.date ?? null,
            allDay: Boolean(event.start?.date && !event.start?.dateTime),
          };
        });
      } catch (error) {
        console.error(`Failed to fetch events for account ${account.id}`, error);
        return [];
      }
    }),
  );

  const events = results.flat().sort((a, b) => {
    if (!a.start || !b.start) return 0;
    return a.start.localeCompare(b.start);
  });

  return NextResponse.json({ events });
}

// POST /api/calendar/events - create an event on one of the linked accounts
export async function POST(request: Request) {
  const body = await request.json();
  const { accountId, summary, description, location, start, end, allDay } = body as {
    accountId: string;
    summary: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    allDay?: boolean;
  };

  if (!accountId || !summary || !start || !end) {
    return NextResponse.json(
      { error: "accountId, summary, start and end are required" },
      { status: 400 },
    );
  }

  const calendar = await getCalendarClient(accountId);

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary,
      description,
      location,
      start: allDay ? { date: start } : { dateTime: start },
      end: allDay ? { date: end } : { dateTime: end },
    },
  });

  return NextResponse.json({ event: event.data });
}
