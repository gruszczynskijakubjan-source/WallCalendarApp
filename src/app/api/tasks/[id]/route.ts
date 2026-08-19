import { NextResponse } from "next/server";
import { getTasksClient } from "@/lib/google";

function splitTaskId(id: string) {
  const [accountId, taskListId, ...rest] = id.split(":");
  return { accountId, taskListId, taskId: rest.join(":") };
}

// PATCH /api/tasks/:id where :id is "<accountId>:<taskListId>:<googleTaskId>"
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { accountId, taskListId, taskId } = splitTaskId(id);

  if (!accountId || !taskListId || !taskId) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const body = await request.json();
  const { done, title } = body as { done?: boolean; title?: string };

  const tasks = await getTasksClient(accountId);
  const task = await tasks.tasks.patch({
    tasklist: taskListId,
    task: taskId,
    requestBody: {
      ...(typeof done === "boolean" ? { status: done ? "completed" : "needsAction" } : {}),
      ...(typeof title === "string" ? { title } : {}),
    },
  });

  return NextResponse.json({ task: task.data });
}

// DELETE /api/tasks/:id where :id is "<accountId>:<taskListId>:<googleTaskId>"
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { accountId, taskListId, taskId } = splitTaskId(id);

  if (!accountId || !taskListId || !taskId) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const tasks = await getTasksClient(accountId);
  await tasks.tasks.delete({ tasklist: taskListId, task: taskId });

  return NextResponse.json({ ok: true });
}
