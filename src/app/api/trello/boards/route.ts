import { NextResponse } from "next/server";
import { getTrelloConnection, trelloFetch } from "@/lib/trello";

// GET /api/trello/boards — the user's open Trello boards.
export async function GET() {
  const connection = await getTrelloConnection();
  if (!connection) {
    return NextResponse.json({ error: "Brak połączenia z Trello" }, { status: 400 });
  }

  const res = await trelloFetch(
    connection.apiKey,
    connection.token,
    "/members/me/boards?filter=open&fields=id,name",
  );
  const boards = (await res.json()) as { id: string; name: string }[];
  return NextResponse.json({ boards });
}
