import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = request.nextUrl;

    const top = searchParams.get("top") === "true";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const productId = searchParams.get("productId");
    const productName = searchParams.get("productName");

    const query: Record<string, any> = {};
    if (productId) {
      query.productId = productId;
    } else if (productName) {
      query.productName = productName;
    }

    let sortField: Record<string, 1 | -1> = { createdAt: -1 };
    if (top) {
      sortField = { rating: -1, createdAt: -1 };
    }

    const reviews = await db
      .collection("reviews")
      .find(query)
      .sort(sortField)
      .limit(limit)
      .toArray();

    const formatted = reviews.map((r) => ({
      ...r,
      _id: r._id.toString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
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
    const { productId, productName, rating, comment } = body;

    if (!productId || !productName || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if user purchased the product
    const order = await db.collection("orders").findOne({
      userId: session.user.id,
      "items.productId": productId,
      status: "delivered",
    });

    const isDemoUser = session.user.email === "demo@megears.com";
    if (!order && !isDemoUser) {
      return NextResponse.json(
        { error: "You must purchase and receive delivery of this product before reviewing it." },
        { status: 403 }
      );
    }

    const reviewId = new ObjectId().toString();
    const newReview = {
      _id: reviewId,
      userId: session.user.id,
      userName: session.user.name,
      userAvatar: session.user.image || null,
      rating: parseInt(rating, 10),
      comment,
      productId,
      productName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("reviews").insertOne(newReview as any);

    // Calculate new rating and reviewCount for product
    const allProductReviews = await db
      .collection("reviews")
      .find({ productId })
      .toArray();

    const reviewCount = allProductReviews.length;
    const avgRating =
      allProductReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

    await db.collection("products").updateOne(
      { _id: productId } as any,
      {
        $set: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount,
        },
      }
    );

    return NextResponse.json(newReview);
  } catch (error) {
    console.error("Failed to post review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, rating, comment } = body;

    if (!reviewId || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const review = await db.collection("reviews").findOne({ _id: reviewId } as any);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("reviews").updateOne(
      { _id: reviewId } as any,
      {
        $set: {
          rating: parseInt(rating, 10),
          comment,
          updatedAt: new Date(),
        },
      }
    );

    // Update product average rating
    const productId = review.productId;
    const allProductReviews = await db
      .collection("reviews")
      .find({ productId })
      .toArray();

    const reviewCount = allProductReviews.length;
    const avgRating =
      allProductReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

    await db.collection("products").updateOne(
      { _id: productId } as any,
      {
        $set: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json({ error: "Missing reviewId" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const review = await db.collection("reviews").findOne({ _id: reviewId } as any);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin";
    if (review.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("reviews").deleteOne({ _id: reviewId } as any);

    // Update product rating
    const productId = review.productId;
    const allProductReviews = await db
      .collection("reviews")
      .find({ productId })
      .toArray();

    const reviewCount = allProductReviews.length;
    const avgRating =
      reviewCount > 0
        ? allProductReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    await db.collection("products").updateOne(
      { _id: productId } as any,
      {
        $set: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
