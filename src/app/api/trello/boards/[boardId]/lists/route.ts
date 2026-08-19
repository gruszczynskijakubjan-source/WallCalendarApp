import { NextResponse } from "next/server";
import { getTrelloConnection, trelloFetch } from "@/lib/trello";

// GET /api/trello/boards/:boardId/lists — the open lists on a board.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const connection = await getTrelloConnection();
  if (!connection) {
    return NextResponse.json({ error: "Brak połączenia z Trello" }, { status: 400 });
  }

  const res = await trelloFetch(
    connection.apiKey,
    connection.token,
    `/boards/${encodeURIComponent(boardId)}/lists?filter=open&fields=id,name`,
  );
  const lists = (await res.json()) as { id: string; name: string }[];
  return NextResponse.json({ lists });
}
