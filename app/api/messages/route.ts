import { Session, verifyServerAuth } from "@/lib/middlewares/verify-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return verifyServerAuth(async (session: Session) => {
    try {
      const messages = await prisma.messages.findMany({
        where: {
          userId: session!.user.id,
        },
      });
      return NextResponse.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json("Error fetching messages", { status: 500 });
    }
  });
}
