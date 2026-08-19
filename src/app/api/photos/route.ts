import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function GET() {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, dataUrl: true },
  });
  return NextResponse.json({ photos });
}

export async function POST(request: Request) {
  let dataUrl: string | undefined;
  try {
    ({ dataUrl } = (await request.json()) as { dataUrl: string });
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie" }, { status: 400 });
  }

  if (!dataUrl || typeof dataUrl !== "string") {
    return NextResponse.json({ error: "dataUrl is required" }, { status: 400 });
  }

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match || !ALLOWED_TYPES.includes(match[1].toLowerCase())) {
    return NextResponse.json({ error: "Nieobsługiwany typ obrazu" }, { status: 400 });
  }

  const approxBytes = (match[2].length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Obraz jest za duży (max 20 MB)" }, { status: 400 });
  }

  const photo = await prisma.photo.create({ data: { dataUrl } });
  return NextResponse.json({ photo: { id: photo.id } });
}
