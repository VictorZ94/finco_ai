import AuthDemo from "@/components/AuthDemo";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Image from "next/image";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 py-16 bg-white dark:bg-black rounded-xl shadow-sm">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={120}
          height={24}
          priority
        />

        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Better Auth Integration</h1>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            Secure authentication with Prisma, PostgreSQL, and Next.js 16.
          </p>
        </div>

        <div className="w-full max-w-md">
          <AuthDemo />
        </div>

        <div className="mt-8 p-4 bg-gray-100 dark:bg-zinc-900 rounded-lg w-full max-w-2xl overflow-auto text-xs">
          <h3 className="font-bold mb-2 uppercase text-zinc-500">
            Server Side Session Debug
          </h3>
          {session ? (
            <pre>{JSON.stringify(session, null, 2)}</pre>
          ) : (
            <p className="text-zinc-500">No active session on server.</p>
          )}
        </div>
      </main>
    </div>
  );
}
