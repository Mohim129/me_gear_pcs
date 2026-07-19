import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = request.nextUrl;

    const sort = searchParams.get("sort") || "newest";
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const category = searchParams.get("category");

    const query: Record<string, unknown> = {};
    if (category) {
      query["category.slug"] = category;
    }

    let sortField: Record<string, 1 | -1>;
    switch (sort) {
      case "rating":
        sortField = { rating: -1, createdAt: -1 };
        break;
      case "price-low":
        sortField = { price: 1 };
        break;
      case "price-high":
        sortField = { price: -1 };
        break;
      case "newest":
      default:
        sortField = { createdAt: -1 };
        break;
    }

    const products = await db
      .collection("products")
      .find(query)
      .sort(sortField)
      .limit(limit)
      .toArray();

    const formatted = products.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image,
      images: p.images,
      category: p.category,
      brand: p.brand,
      stock: p.stock,
      rating: p.rating,
      reviewCount: p.reviewCount,
      features: p.features,
      createdAt: p.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
