import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const verifyServerAuth = async (
  callback: (
    session: Awaited<ReturnType<typeof auth.api.getSession>>,
  ) => Promise<Response>,
): Promise<Response> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return callback(session as Awaited<ReturnType<typeof auth.api.getSession>>);
};
