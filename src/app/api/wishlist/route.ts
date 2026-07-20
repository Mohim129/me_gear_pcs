import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    const queryUserIds = [session.user.id];
    try {
      if (ObjectId.isValid(session.user.id)) {
        queryUserIds.push(new ObjectId(session.user.id) as any);
      }
    } catch (e) {}

    const wishlistItems = await db
      .collection("wishlist")
      .find({ userId: { $in: queryUserIds } })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate with product data
    const productIds = wishlistItems.map((item) => item.productId);
    const queryProductIds = [];
    for (const id of productIds) {
      queryProductIds.push(id);
      try {
        if (ObjectId.isValid(id)) {
          queryProductIds.push(new ObjectId(id));
        }
      } catch (e) {}
    }

    const products = await db
      .collection("products")
      .find({ _id: { $in: queryProductIds } as any })
      .toArray();

    const productMap = new Map();
    for (const p of products) {
      productMap.set(p._id.toString(), p);
    }

    const populated = wishlistItems.map((item) => {
      const product = productMap.get(item.productId.toString());
      return {
        _id: item._id.toString(),
        productId: item.productId.toString(),
        createdAt: item.createdAt,
        product: product
          ? {
              _id: product._id.toString(),
              name: product.name,
              slug: product.slug,
              price: product.price,
              originalPrice: product.originalPrice,
              image: product.image,
              category: product.category,
              brand: product.brand,
              stock: product.stock,
              rating: product.rating,
              reviewCount: product.reviewCount,
            }
          : null,
      };
    });

    return NextResponse.json(populated);
  } catch (error) {
    console.error("Failed to fetch wishlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Upsert to prevent duplicates
    await db.collection("wishlist").updateOne(
      { userId: session.user.id, productId },
      {
        $setOnInsert: {
          userId: session.user.id,
          productId,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add to wishlist:", error);
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId query parameter is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const queryUserIds = [session.user.id];
    try {
      if (ObjectId.isValid(session.user.id)) {
        queryUserIds.push(new ObjectId(session.user.id) as any);
      }
    } catch (e) {}

    await db.collection("wishlist").deleteOne({
      userId: { $in: queryUserIds },
      productId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove from wishlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}
