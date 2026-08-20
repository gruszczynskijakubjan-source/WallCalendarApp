import type { NextApiRequest, NextApiResponse } from "next";
import { getTasksClient } from "@/lib/google";

function splitTaskId(id: string) {
  const [accountId, taskListId, ...rest] = id.split(":");
  return { accountId, taskListId, taskId: rest.join(":") };
}

// PATCH /api/tasks/:id where :id is "<accountId>:<taskListId>:<googleTaskId>"
async function patch(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  const { accountId, taskListId, taskId } = splitTaskId(id);

  if (!accountId || !taskListId || !taskId) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  const { done, title } = req.body as { done?: boolean; title?: string };

  const tasks = await getTasksClient(accountId);
  const task = await tasks.tasks.patch({
    tasklist: taskListId,
    task: taskId,
    requestBody: {
      ...(typeof done === "boolean" ? { status: done ? "completed" : "needsAction" } : {}),
      ...(typeof title === "string" ? { title } : {}),
    },
  });

  return res.status(200).json({ task: task.data });
}

// DELETE /api/tasks/:id where :id is "<accountId>:<taskListId>:<googleTaskId>"
async function del(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  const { accountId, taskListId, taskId } = splitTaskId(id);

  if (!accountId || !taskListId || !taskId) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  const tasks = await getTasksClient(accountId);
  await tasks.tasks.delete({ tasklist: taskListId, task: taskId });

  return res.status(200).json({ ok: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") return patch(req, res);
  if (req.method === "DELETE") return del(req, res);
  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).end();
}
