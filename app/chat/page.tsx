import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ChatInterface from "./chat-interface";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black">
      <header className="flex-none p-4 border-b bg-white dark:bg-zinc-900 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          Finco AI Chat
        </h1>
        <div className="text-sm text-gray-500">{session.user.email}</div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        <ChatInterface user={session.user} />
      </main>
    </div>
  );
}
