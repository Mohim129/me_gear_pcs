import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: PageProps) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { db } = await connectToDatabase();

    let query: any = {};
    try {
      query._id = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await db.collection("orders").findOne(query);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow the order owner or admin to view
    const isAdmin = session.user.role === "admin";
    if (order.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...order,
      _id: order._id.toString(),
    });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
