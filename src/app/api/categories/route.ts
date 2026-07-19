import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const categories = await db
      .collection("categories")
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    const formatted = categories.map((cat) => ({
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      createdAt: cat.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
