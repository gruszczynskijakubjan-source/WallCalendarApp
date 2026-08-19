import { NextResponse } from "next/server";
import { getTasksClient, getLinkedGoogleAccounts } from "@/lib/google";

export type MergedTask = {
  id: string;
  accountId: string;
  taskListId: string;
  ownerName: string | null;
  ownerImage: string | null;
  title: string;
  done: boolean;
  updatedAt: string;
};

const DEFAULT_COMPLETED_PAGE_SIZE = 5;

// GET /api/tasks?completedOffset=0&completedLimit=15
// Active tasks are always returned in full; completed ones are paginated so
// the UI can lazily load more as the user scrolls.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const completedOffset = Number(searchParams.get("completedOffset") ?? "0");
  const completedLimit = Number(
    searchParams.get("completedLimit") ?? DEFAULT_COMPLETED_PAGE_SIZE,
  );

  const accounts = await getLinkedGoogleAccounts();

  const results = await Promise.all(
    accounts.map(async (account) => {
      try {
        const tasks = await getTasksClient(account.id);

        const taskLists = await tasks.tasklists.list({ maxResults: 1 });
        const taskListId = taskLists.data.items?.[0]?.id;
        if (!taskListId) return [];

        const res = await tasks.tasks.list({
          tasklist: taskListId,
          showCompleted: true,
          showHidden: true,
          // Google Tasks defaults to 20 results; without a high explicit
          // limit, active tasks interleaved with hundreds of completed ones
          // can get truncated before we even see them.
          maxResults: 500,
        });

        return (res.data.items ?? []).map(
          (task): MergedTask => ({
            id: `${account.id}:${taskListId}:${task.id}`,
            accountId: account.id,
            taskListId,
            ownerName: account.user.name,
            ownerImage: account.user.customImage ?? account.user.image,
            title: task.title ?? "(bez tytułu)",
            done: task.status === "completed",
            updatedAt: task.updated ?? new Date(0).toISOString(),
          }),
        );
      } catch (error) {
        console.error(`Failed to fetch tasks for account ${account.id}`, error);
        return [];
      }
    }),
  );

  const allTasks = results.flat();
  const active = allTasks
    .filter((t) => !t.done)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const completedAll = allTasks
    .filter((t) => t.done)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const completedPage = completedAll.slice(completedOffset, completedOffset + completedLimit);
  const hasMoreCompleted = completedOffset + completedLimit < completedAll.length;

  return NextResponse.json({
    tasks: completedOffset === 0 ? [...active, ...completedPage] : completedPage,
    hasMoreCompleted,
  });
}

// POST /api/tasks — create a task on one account's default task list.
export async function POST(request: Request) {
  const { accountId, title } = await request.json();
  if (!accountId || !title) {
    return NextResponse.json({ error: "accountId and title are required" }, { status: 400 });
  }

  const tasks = await getTasksClient(accountId);
  const taskLists = await tasks.tasklists.list({ maxResults: 1 });
  const taskListId = taskLists.data.items?.[0]?.id;
  if (!taskListId) {
    return NextResponse.json({ error: "Brak listy zadań na koncie" }, { status: 400 });
  }

  const task = await tasks.tasks.insert({
    tasklist: taskListId,
    requestBody: { title },
  });

  return NextResponse.json({ task: task.data });
}
