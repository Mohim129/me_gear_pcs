import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "All";

    const { db } = await connectToDatabase();

    const query: any = {};

    // Apply status filter
    if (status !== "All") {
      query.status = status;
    }

    // Apply search filter (orderId, customerName, userEmail)
    if (search.trim()) {
      const isObjectId = ObjectId.isValid(search.trim());
      if (isObjectId) {
        query._id = new ObjectId(search.trim());
      } else {
        query.$or = [
          { userName: { $regex: search.trim(), $options: "i" } },
          { userEmail: { $regex: search.trim(), $options: "i" } },
          { "shippingAddress.fullName": { $regex: search.trim(), $options: "i" } },
        ];
      }
    }

    const orders = await db
      .collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Fetch orders admin API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
