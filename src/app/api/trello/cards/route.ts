import { NextResponse } from "next/server";
import { getTrelloConnection, trelloFetch } from "@/lib/trello";

export type TrelloCard = {
  id: string;
  name: string;
  done: boolean;
};

// GET /api/trello/cards — cards on the configured shopping list (open + archived).
export async function GET() {
  const connection = await getTrelloConnection();
  if (!connection?.listId) {
    return NextResponse.json({ cards: [], configured: false });
  }

  const [openRes, closedRes] = await Promise.all([
    trelloFetch(
      connection.apiKey,
      connection.token,
      `/lists/${encodeURIComponent(connection.listId)}/cards?filter=open&fields=id,name`,
    ),
    trelloFetch(
      connection.apiKey,
      connection.token,
      `/lists/${encodeURIComponent(connection.listId)}/cards?filter=closed&fields=id,name`,
    ),
  ]);

  const open = (await openRes.json()) as { id: string; name: string }[];
  const closed = (await closedRes.json()) as { id: string; name: string }[];

  const cards: TrelloCard[] = [
    ...open.map((c) => ({ ...c, done: false })),
    ...closed.map((c) => ({ ...c, done: true })),
  ];

  return NextResponse.json({ cards, configured: true });
}

// DELETE /api/trello/cards — permanently delete every card on the configured list.
export async function DELETE() {
  const connection = await getTrelloConnection();
  if (!connection?.listId) {
    return NextResponse.json({ error: "Nie skonfigurowano listy Trello" }, { status: 400 });
  }

  const [openRes, closedRes] = await Promise.all([
    trelloFetch(
      connection.apiKey,
      connection.token,
      `/lists/${encodeURIComponent(connection.listId)}/cards?filter=open&fields=id`,
    ),
    trelloFetch(
      connection.apiKey,
      connection.token,
      `/lists/${encodeURIComponent(connection.listId)}/cards?filter=closed&fields=id`,
    ),
  ]);
  const open = (await openRes.json()) as { id: string }[];
  const closed = (await closedRes.json()) as { id: string }[];

  await Promise.all(
    [...open, ...closed].map((c) =>
      trelloFetch(connection.apiKey, connection.token, `/cards/${c.id}`, {
        method: "DELETE",
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}

// POST /api/trello/cards — add a card to the configured shopping list.
export async function POST(request: Request) {
  const { name } = (await request.json()) as { name?: string };
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const connection = await getTrelloConnection();
  if (!connection?.listId) {
    return NextResponse.json({ error: "Nie skonfigurowano listy Trello" }, { status: 400 });
  }

  const res = await trelloFetch(connection.apiKey, connection.token, "/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idList: connection.listId, name }),
  });
  const card = await res.json();
  return NextResponse.json({ card });
}
