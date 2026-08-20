import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

async function get(req: NextApiRequest, res: NextApiResponse) {
  const todos = await prisma.todo.findMany({
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true, image: true } } },
  });
  return res.status(200).json({ todos });
}

async function post(req: NextApiRequest, res: NextApiResponse) {
  const { title, createdById } = req.body;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }

  const todo = await prisma.todo.create({
    data: { title, createdById: createdById ?? null },
  });
  return res.status(200).json({ todo });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return get(req, res);
  if (req.method === "POST") return post(req, res);
  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}
