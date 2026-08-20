import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

async function patch(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  const body = req.body;

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(typeof body.done === "boolean" ? { done: body.done } : {}),
      ...(typeof body.title === "string" ? { title: body.title } : {}),
    },
  });

  return res.status(200).json({ todo });
}

async function del(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  await prisma.todo.delete({ where: { id } });
  return res.status(200).json({ ok: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") return patch(req, res);
  if (req.method === "DELETE") return del(req, res);
  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).end();
}
