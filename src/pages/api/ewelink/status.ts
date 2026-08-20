import type { NextApiRequest, NextApiResponse } from "next";
import { getEweLinkConnection } from "@/lib/ewelink";
import { prisma } from "@/lib/prisma";

async function get(req: NextApiRequest, res: NextApiResponse) {
  const connection = await getEweLinkConnection();
  return res.status(200).json({ connected: Boolean(connection) });
}

async function del(req: NextApiRequest, res: NextApiResponse) {
  const connection = await getEweLinkConnection();
  if (connection) {
    await prisma.eweLinkConnection.delete({ where: { id: connection.id } });
  }
  return res.status(200).json({ ok: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return get(req, res);
  if (req.method === "DELETE") return del(req, res);
  res.setHeader("Allow", "GET, DELETE");
  return res.status(405).end();
}
