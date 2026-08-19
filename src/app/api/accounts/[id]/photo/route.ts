import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// PUT /api/accounts/:id/photo — :id is the Account id (as returned by /api/accounts)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: accountId } = await params;

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

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    return NextResponse.json({ error: "Nie znaleziono konta" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: account.userId },
    data: { customImage: dataUrl },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/accounts/:id/photo — resets to the Google profile picture
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: accountId } = await params;

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    return NextResponse.json({ error: "Nie znaleziono konta" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: account.userId },
    data: { customImage: null },
  });

  return NextResponse.json({ ok: true });
}
