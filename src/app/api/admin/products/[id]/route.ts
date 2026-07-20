import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

// PUT edit product details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Product ID" }, { status: 400 });
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

    const { db } = await connectToDatabase();

    const existingProduct = await db.collection("products").findOne({ _id: new ObjectId(id) });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (name) updateFields.name = name;
    if (sku) updateFields.sku = sku;
    if (brand) updateFields.brand = brand;
    if (description !== undefined) updateFields.description = description;
    if (price !== undefined) updateFields.price = Number(price);
    if (originalPrice !== undefined) updateFields.originalPrice = Number(originalPrice);
    if (stock !== undefined) updateFields.stock = Number(stock);
    if (category && category.name && category.slug) {
      updateFields.category = {
        name: category.name,
        slug: category.slug,
      };
    }
    if (image) updateFields.image = image;
    if (Array.isArray(images)) updateFields.images = images;
    if (Array.isArray(features)) updateFields.features = features;
    if (specifications) updateFields.specifications = specifications;

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true, message: "Product updated successfully" });
  } catch (error: any) {
    console.error("PUT admin product error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE product from DB
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Product ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("DELETE admin product error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
