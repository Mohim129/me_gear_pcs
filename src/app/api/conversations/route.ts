import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    const { db } = await connectToDatabase();

    let query: any = null;
    if (session?.user?.id) {
      query = { userId: session.user.id };
    } else if (sessionId) {
      query = { sessionId };
    }

    if (!query) {
      return NextResponse.json({ messages: [] });
    }

    const conversation = await db
      .collection("conversations")
      .findOne(query, { sort: { updatedAt: -1 } });

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("Failed to fetch conversation:", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}
