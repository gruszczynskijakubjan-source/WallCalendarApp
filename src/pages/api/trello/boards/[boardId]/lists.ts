import type { NextApiRequest, NextApiResponse } from "next";
import { getTrelloConnection, trelloFetch } from "@/lib/trello";

// GET /api/trello/boards/:boardId/lists — the open lists on a board.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const boardId = req.query.boardId as string;
  const connection = await getTrelloConnection();
  if (!connection) {
    return res.status(400).json({ error: "Brak połączenia z Trello" });
  }

  const trelloRes = await trelloFetch(
    connection.apiKey,
    connection.token,
    `/boards/${encodeURIComponent(boardId)}/lists?filter=open&fields=id,name`,
  );
  const lists = (await trelloRes.json()) as { id: string; name: string }[];
  return res.status(200).json({ lists });
}
