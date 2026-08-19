import { NextResponse } from "next/server";
import { getTrelloConnection, trelloFetch } from "@/lib/trello";

// PATCH /api/trello/cards/:id — toggle done (archives/unarchives the card).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { done } = (await request.json()) as { done: boolean };

  const connection = await getTrelloConnection();
  if (!connection) {
    return NextResponse.json({ error: "Brak połączenia z Trello" }, { status: 400 });
  }

  await trelloFetch(connection.apiKey, connection.token, `/cards/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ closed: done }),
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/trello/cards/:id — permanently delete the card.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const connection = await getTrelloConnection();
  if (!connection) {
    return NextResponse.json({ error: "Brak połączenia z Trello" }, { status: 400 });
  }

  await trelloFetch(connection.apiKey, connection.token, `/cards/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return NextResponse.json({ ok: true });
}
