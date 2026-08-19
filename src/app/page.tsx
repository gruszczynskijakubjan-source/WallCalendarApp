import Link from "next/link";
import CalendarBoard from "@/components/CalendarBoard";
import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <main className="flex h-screen flex-col gap-4 bg-gray-50 p-4 md:p-6">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
        <CalendarBoard />
        <TodoList />
      </div>
      <footer className="flex justify-center">
        <Link href="/settings" className="text-sm text-gray-400 hover:text-gray-600">
          Ustawienia
        </Link>
      </footer>
    </main>
  );
}
