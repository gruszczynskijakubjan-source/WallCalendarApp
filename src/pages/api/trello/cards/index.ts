import type { NextApiRequest, NextApiResponse } from "next";
import { getTrelloConnection, trelloFetch } from "@/lib/trello";

export type TrelloCard = {
  id: string;
  name: string;
  done: boolean;
};

// GET /api/trello/cards — cards on the configured shopping list (open + archived).
async function get(req: NextApiRequest, res: NextApiResponse) {
  const connection = await getTrelloConnection();
  if (!connection?.listId) {
    return res.status(200).json({ cards: [], configured: false });
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

  // Trello can briefly return the same card in both the open and closed
  // filters while a state change is propagating; keep the closed (done)
  // version in that case since it reflects the more recent write.
  const byId = new Map<string, TrelloCard>();
  for (const c of open) byId.set(c.id, { ...c, done: false });
  for (const c of closed) byId.set(c.id, { ...c, done: true });

  return res.status(200).json({ cards: [...byId.values()], configured: true });
}

// DELETE /api/trello/cards — permanently delete every card on the configured list.
async function del(req: NextApiRequest, res: NextApiResponse) {
  const connection = await getTrelloConnection();
  if (!connection?.listId) {
    return res.status(400).json({ error: "Nie skonfigurowano listy Trello" });
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

  return res.status(200).json({ ok: true });
}

// POST /api/trello/cards — add a card to the configured shopping list.
async function post(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body as { name?: string };
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const connection = await getTrelloConnection();
  if (!connection?.listId) {
    return res.status(400).json({ error: "Nie skonfigurowano listy Trello" });
  }

  const trelloRes = await trelloFetch(connection.apiKey, connection.token, "/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idList: connection.listId, name }),
  });
  const card = await trelloRes.json();
  return res.status(200).json({ card });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return get(req, res);
  if (req.method === "DELETE") return del(req, res);
  if (req.method === "POST") return post(req, res);
  res.setHeader("Allow", "GET, DELETE, POST");
  return res.status(405).end();
}
