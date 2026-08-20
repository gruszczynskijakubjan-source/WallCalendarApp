import type { NextApiRequest, NextApiResponse } from "next";
import { getCalendarClient } from "@/lib/google";

function splitEventId(id: string) {
  const [accountId, ...rest] = id.split(":");
  return { accountId, googleEventId: rest.join(":") };
}

// PATCH /api/calendar/events/:id where :id is "<accountId>:<googleEventId>"
async function patch(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  const { accountId, googleEventId } = splitEventId(id);

  if (!accountId || !googleEventId) {
    return res.status(400).json({ error: "Invalid event id" });
  }

  const { summary, description, location, start, end, allDay } = req.body as {
    summary: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    allDay?: boolean;
  };

  if (!summary || !start || !end) {
    return res.status(400).json({ error: "summary, start and end are required" });
  }

  const calendar = await getCalendarClient(accountId);

  const event = await calendar.events.patch({
    calendarId: "primary",
    eventId: googleEventId,
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

// DELETE /api/calendar/events/:id where :id is "<accountId>:<googleEventId>"
async function del(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  const { accountId, googleEventId } = splitEventId(id);

  if (!accountId || !googleEventId) {
    return res.status(400).json({ error: "Invalid event id" });
  }

  const calendar = await getCalendarClient(accountId);
  await calendar.events.delete({ calendarId: "primary", eventId: googleEventId });

  return res.status(200).json({ ok: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") return patch(req, res);
  if (req.method === "DELETE") return del(req, res);
  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).end();
}
