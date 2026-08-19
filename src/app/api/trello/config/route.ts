import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrelloConnection, trelloFetch } from "@/lib/trello";

// GET /api/trello/config — connection status, without leaking the token to the client.
export async function GET() {
  const connection = await getTrelloConnection();
  if (!connection) {
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({
    connected: true,
    boardId: connection.boardId,
    boardName: connection.boardName,
    listId: connection.listId,
    listName: connection.listName,
  });
}

// PUT /api/trello/config — save (or replace) the API key + token.
export async function PUT(request: Request) {
  const { apiKey, token } = (await request.json()) as { apiKey?: string; token?: string };
  if (!apiKey || !token) {
    return NextResponse.json({ error: "apiKey i token są wymagane" }, { status: 400 });
  }

  try {
    await trelloFetch(apiKey, token, "/members/me");
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowy klucz lub token Trello" },
      { status: 400 },
    );
  }

  const existing = await getTrelloConnection();
  if (existing) {
    await prisma.trelloConnection.update({
      where: { id: existing.id },
      data: { apiKey, token, boardId: null, boardName: null, listId: null, listName: null },
    });
  } else {
    await prisma.trelloConnection.create({ data: { apiKey, token } });
  }

  return NextResponse.json({ ok: true });
}

// PATCH /api/trello/config — set which board/list maps to "Lista zakupów".
export async function PATCH(request: Request) {
  const { boardId, boardName, listId, listName } = (await request.json()) as {
    boardId: string;
    boardName: string;
    listId: string;
    listName: string;
  };

  const existing = await getTrelloConnection();
  if (!existing) {
    return NextResponse.json({ error: "Brak połączenia z Trello" }, { status: 400 });
  }

  await prisma.trelloConnection.update({
    where: { id: existing.id },
    data: { boardId, boardName, listId, listName },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/trello/config — disconnect Trello entirely.
export async function DELETE() {
  const existing = await getTrelloConnection();
  if (existing) {
    await prisma.trelloConnection.delete({ where: { id: existing.id } });
  }
  return NextResponse.json({ ok: true });
}
