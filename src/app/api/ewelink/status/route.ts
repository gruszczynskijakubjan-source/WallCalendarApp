import { NextResponse } from "next/server";
import { getEweLinkConnection } from "@/lib/ewelink";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const connection = await getEweLinkConnection();
  return NextResponse.json({ connected: Boolean(connection) });
}

export async function DELETE() {
  const connection = await getEweLinkConnection();
  if (connection) {
    await prisma.eweLinkConnection.delete({ where: { id: connection.id } });
  }
  return NextResponse.json({ ok: true });
}
