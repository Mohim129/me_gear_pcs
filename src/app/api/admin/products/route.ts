import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

// GET admin products listing
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
    const category = searchParams.get("category") || "All";

    const { db } = await connectToDatabase();

    const query: any = {};

    if (category !== "All") {
      query["category.slug"] = category;
    }

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { brand: { $regex: search.trim(), $options: "i" } },
        { sku: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const products = await db
      .collection("products")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("GET admin products error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      sku,
      brand,
      description,
      price,
      originalPrice,
      stock,
      category,
      image,
      images,
      features,
      specifications,
    } = body;

    if (!name || !price || !category || !category.name || !category.slug) {
      return NextResponse.json(
        { error: "Product name, price, and category are required." },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const newProduct = {
      name,
      sku: sku || `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      brand: brand || "Generic",
      description: description || "",
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Number(price),
      stock: Number(stock) || 0,
      category: {
        name: category.name,
        slug: category.slug,
      },
      image: image || "/images/placeholder.jpg",
      images: Array.isArray(images) && images.length > 0 ? images : [image || "/images/placeholder.jpg"],
      features: Array.isArray(features) ? features : [],
      specifications: specifications || {},
      rating: 4.5,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("products").insertOne(newProduct);

    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...newProduct,
    });
  } catch (error: any) {
    console.error("POST admin products error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
