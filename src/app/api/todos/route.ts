import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const todos = await prisma.todo.findMany({
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true, image: true } } },
  });
  return NextResponse.json({ todos });
}

export async function POST(request: Request) {
  const { title, createdById } = await request.json();
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const todo = await prisma.todo.create({
    data: { title, createdById: createdById ?? null },
  });
  return NextResponse.json({ todo });
}
