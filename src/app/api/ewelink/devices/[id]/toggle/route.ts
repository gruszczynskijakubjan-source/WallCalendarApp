import { NextResponse } from "next/server";
import { eweLinkFetch } from "@/lib/ewelink";

// PATCH /api/ewelink/devices/:id/toggle — turn a single-switch device on/off.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { on } = (await request.json()) as { on: boolean };

  await eweLinkFetch("/v2/device/thing/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: 1,
      id,
      params: { switch: on ? "on" : "off" },
    }),
  });

  return NextResponse.json({ ok: true });
}
