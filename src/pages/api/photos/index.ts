import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Photos are sent as base64 data URLs in the JSON body (up to ~27MB once
// base64-encoded from a 20MB image), well past Next's 1MB API body default.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "30mb",
    },
  },
};

async function get(req: NextApiRequest, res: NextApiResponse) {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, dataUrl: true },
  });
  return res.status(200).json({ photos });
}

async function post(req: NextApiRequest, res: NextApiResponse) {
  const dataUrl = req.body?.dataUrl;
  if (!dataUrl || typeof dataUrl !== "string") {
    return res.status(400).json({ error: "dataUrl is required" });
  }

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match || !ALLOWED_TYPES.includes(match[1].toLowerCase())) {
    return res.status(400).json({ error: "Nieobsługiwany typ obrazu" });
  }

  const approxBytes = (match[2].length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) {
    return res.status(400).json({ error: "Obraz jest za duży (max 20 MB)" });
  }

  const photo = await prisma.photo.create({ data: { dataUrl } });
  return res.status(200).json({ photo: { id: photo.id } });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return get(req, res);
  if (req.method === "POST") return post(req, res);
  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}
