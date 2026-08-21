import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/accounts/:id/photo-file — streams the account's custom profile
// photo as a real image response with cache headers, so it loads via
// <img src> and benefits from the browser's normal image cache instead of
// being inlined as a multi-MB base64 string inside every JSON response that
// references this account (accounts, tasks, calendar events) — which was
// large enough to noticeably slow down every page load.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: accountId } = await params;

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { user: { select: { customImage: true } } },
  });

  const dataUrl = account?.user.customImage;
  if (!dataUrl) {
    return new NextResponse(null, { status: 404 });
  }

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
