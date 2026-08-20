import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getTrelloConnection, trelloFetch } from "@/lib/trello";

// GET /api/trello/config — connection status, without leaking the token to the client.
async function get(req: NextApiRequest, res: NextApiResponse) {
  const connection = await getTrelloConnection();
  if (!connection) {
    return res.status(200).json({ connected: false });
  }
  return res.status(200).json({
    connected: true,
    boardId: connection.boardId,
    boardName: connection.boardName,
    listId: connection.listId,
    listName: connection.listName,
  });
}

// PUT /api/trello/config — save (or replace) the API key + token.
async function put(req: NextApiRequest, res: NextApiResponse) {
  const { apiKey, token } = req.body as { apiKey?: string; token?: string };
  if (!apiKey || !token) {
    return res.status(400).json({ error: "apiKey i token są wymagane" });
  }

  try {
    await trelloFetch(apiKey, token, "/members/me");
  } catch {
    return res.status(400).json({ error: "Nieprawidłowy klucz lub token Trello" });
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

  return res.status(200).json({ ok: true });
}

// PATCH /api/trello/config — set which board/list maps to "Lista zakupów".
async function patch(req: NextApiRequest, res: NextApiResponse) {
  const { boardId, boardName, listId, listName } = req.body as {
    boardId: string;
    boardName: string;
    listId: string;
    listName: string;
  };

  const existing = await getTrelloConnection();
  if (!existing) {
    return res.status(400).json({ error: "Brak połączenia z Trello" });
  }

  await prisma.trelloConnection.update({
    where: { id: existing.id },
    data: { boardId, boardName, listId, listName },
  });

  return res.status(200).json({ ok: true });
}

// DELETE /api/trello/config — disconnect Trello entirely.
async function del(req: NextApiRequest, res: NextApiResponse) {
  const existing = await getTrelloConnection();
  if (existing) {
    await prisma.trelloConnection.delete({ where: { id: existing.id } });
  }
  return res.status(200).json({ ok: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return get(req, res);
  if (req.method === "PUT") return put(req, res);
  if (req.method === "PATCH") return patch(req, res);
  if (req.method === "DELETE") return del(req, res);
  res.setHeader("Allow", "GET, PUT, PATCH, DELETE");
  return res.status(405).end();
}
