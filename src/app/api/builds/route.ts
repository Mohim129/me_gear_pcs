import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { components, totalPrice } = body;

    if (!components || typeof components !== "object" || Object.keys(components).length === 0) {
      return NextResponse.json(
        { error: "Cannot save an empty PC build." },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const buildId = new ObjectId().toString();
    const buildDoc = {
      _id: buildId,
      userId: session.user.id,
      components, // Record<slotId, productId>
      totalPrice: Number(totalPrice) || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("builds").insertOne(buildDoc as any);

    return NextResponse.json({ success: true, buildId });
  } catch (error: any) {
    console.error("Failed to save build:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const builds = await db
      .collection("builds")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(builds);
  } catch (error: any) {
    console.error("Failed to fetch builds:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
