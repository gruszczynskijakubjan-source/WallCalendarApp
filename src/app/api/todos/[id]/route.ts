import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(typeof body.done === "boolean" ? { done: body.done } : {}),
      ...(typeof body.title === "string" ? { title: body.title } : {}),
    },
  });

  return NextResponse.json({ todo });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
