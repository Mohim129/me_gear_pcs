import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = request.nextUrl;

    const sort = searchParams.get("sort") || "newest";
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "9999999");
    const rating = parseFloat(searchParams.get("rating") || "0");
    const categoriesStr = searchParams.get("categories") || "";
    const format = searchParams.get("format");

    const query: Record<string, any> = {};

    // Categories filter
    if (categoriesStr) {
      const categoriesArray = categoriesStr.split(",").filter(Boolean);
      if (categoriesArray.length > 0) {
        query["category.slug"] = { $in: categoriesArray };
      }
    } else {
      const category = searchParams.get("category");
      if (category) {
        query["category.slug"] = category;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } }
      ];
    }

    // Price range filter
    query.price = { $gte: minPrice, $lte: maxPrice };

    // Rating filter
    if (rating > 0) {
      query.rating = { $gte: rating };
    }

    // Sort order mapping
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

    // Paginate operations
    if (format === "paginated") {
      const totalCount = await db.collection("products").countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;

      const products = await db
        .collection("products")
        .find(query)
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .toArray();

      const formatted = products.map((p) => ({
        ...p,
        _id: p._id.toString(),
      }));

      return NextResponse.json({
        products: formatted,
        totalCount,
        totalPages,
        currentPage: page,
      });
    }

    // Simple default list response (backwards compatible for homepage sections)
    const products = await db
      .collection("products")
      .find(query)
      .sort(sortField)
      .limit(limit)
      .toArray();

    const formatted = products.map((p) => ({
      ...p,
      _id: p._id.toString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
