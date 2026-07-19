import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = request.nextUrl;

    const top = searchParams.get("top") === "true";
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    let sortField: Record<string, 1 | -1> = { createdAt: -1 };
    if (top) {
      sortField = { rating: -1, createdAt: -1 };
    }

    const reviews = await db
      .collection("reviews")
      .find({})
      .sort(sortField)
      .limit(limit)
      .toArray();

    const formatted = reviews.map((r) => ({
      _id: r._id.toString(),
      userName: r.userName,
      userAvatar: r.userAvatar,
      rating: r.rating,
      comment: r.comment,
      productName: r.productName,
      createdAt: r.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
