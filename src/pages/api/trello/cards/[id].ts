import type { NextApiRequest, NextApiResponse } from "next";
import { getTrelloConnection, trelloFetch } from "@/lib/trello";

// PATCH /api/trello/cards/:id — toggle done (archives/unarchives the card).
async function patch(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  const { done } = req.body as { done: boolean };

  const connection = await getTrelloConnection();
  if (!connection) {
    return res.status(400).json({ error: "Brak połączenia z Trello" });
  }

  await trelloFetch(connection.apiKey, connection.token, `/cards/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ closed: done }),
  });

  return res.status(200).json({ ok: true });
}

// DELETE /api/trello/cards/:id — permanently delete the card.
async function del(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;

  const connection = await getTrelloConnection();
  if (!connection) {
    return res.status(400).json({ error: "Brak połączenia z Trello" });
  }

  await trelloFetch(connection.apiKey, connection.token, `/cards/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return res.status(200).json({ ok: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") return patch(req, res);
  if (req.method === "DELETE") return del(req, res);
  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).end();
}
