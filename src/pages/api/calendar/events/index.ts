import type { NextApiRequest, NextApiResponse } from "next";
import { getCalendarClient, getLinkedGoogleAccounts } from "@/lib/google";

export type MergedEvent = {
  id: string;
  accountId: string;
  ownerName: string | null;
  ownerImage: string | null;
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
async function get(req: NextApiRequest, res: NextApiResponse) {
  const timeMin = (req.query.timeMin as string) ?? new Date().toISOString();
  const timeMax =
    (req.query.timeMax as string) ??
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
            // See src/pages/api/accounts/index.ts for why this isn't the raw
            // base64 data URL: it would be duplicated per event otherwise.
            ownerImage: account.user.customImage
              ? `/api/accounts/${account.id}/photo-file`
              : account.user.image,
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

  return res.status(200).json({ events });
}

// POST /api/calendar/events - create an event on one of the linked accounts
async function post(req: NextApiRequest, res: NextApiResponse) {
  const { accountId, summary, description, location, start, end, allDay } = req.body as {
    accountId: string;
    summary: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    allDay?: boolean;
  };

  if (!accountId || !summary || !start || !end) {
    return res
      .status(400)
      .json({ error: "accountId, summary, start and end are required" });
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

  return res.status(200).json({ event: event.data });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return get(req, res);
  if (req.method === "POST") return post(req, res);
  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}
