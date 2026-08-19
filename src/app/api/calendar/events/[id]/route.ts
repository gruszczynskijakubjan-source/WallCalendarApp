import { NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google";

function splitEventId(id: string) {
  const [accountId, ...rest] = id.split(":");
  return { accountId, googleEventId: rest.join(":") };
}

// PATCH /api/calendar/events/:id where :id is "<accountId>:<googleEventId>"
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { accountId, googleEventId } = splitEventId(id);

  if (!accountId || !googleEventId) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const body = await request.json();
  const { summary, description, location, start, end, allDay } = body as {
    summary: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    allDay?: boolean;
  };

  if (!summary || !start || !end) {
    return NextResponse.json(
      { error: "summary, start and end are required" },
      { status: 400 },
    );
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

  return NextResponse.json({ event: event.data });
}

// DELETE /api/calendar/events/:id where :id is "<accountId>:<googleEventId>"
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { accountId, googleEventId } = splitEventId(id);

  if (!accountId || !googleEventId) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const calendar = await getCalendarClient(accountId);
  await calendar.events.delete({ calendarId: "primary", eventId: googleEventId });

  return NextResponse.json({ ok: true });
}
