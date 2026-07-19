import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing build ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const build = await db.collection("builds").findOne({ _id: id } as any);

    if (!build) {
      return NextResponse.json({ error: "PC Build not found" }, { status: 404 });
    }

    // Populate the product details for each component
    const productIds = Object.values(build.components) as string[];
    const products = await db
      .collection("products")
      .find({ _id: { $in: productIds } } as any)
      .toArray();

    // Map slot keys to full product documents
    const populatedComponents: Record<string, any> = {};
    for (const [slot, prodId] of Object.entries(build.components)) {
      const match = products.find((p) => p._id === prodId);
      if (match) {
        populatedComponents[slot] = match;
      }
    }

    return NextResponse.json({
      _id: build._id,
      userId: build.userId,
      totalPrice: build.totalPrice,
      createdAt: build.createdAt,
      updatedAt: build.updatedAt,
      components: populatedComponents,
    });
  } catch (error: any) {
    console.error("Failed to fetch build details:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
