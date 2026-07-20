import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

// GET single order details
export async function GET(
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
      return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const order = await db.collection("orders").findOne({ _id: new ObjectId(id) });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("GET order details API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update order status / paymentStatus
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
      return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status, paymentStatus, paymentMethod } = body;

    const { db } = await connectToDatabase();
    const existingOrder = await db.collection("orders").findOne({ _id: new ObjectId(id) });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const oldStatus = existingOrder.status;
    const newStatus = status;

    // Handle stock adjustment if cancelling or reactivating
    if (oldStatus !== "Cancelled" && newStatus === "Cancelled") {
      // Transition TO Cancelled -> Restore Stock (Increment)
      await adjustStock(db, existingOrder.items || [], "increment");
    } else if (oldStatus === "Cancelled" && newStatus && newStatus !== "Cancelled") {
      // Transition FROM Cancelled -> Re-deduct Stock (Decrement)
      await adjustStock(db, existingOrder.items || [], "decrement");
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;
    if (paymentMethod) updateFields.paymentMethod = paymentMethod;

    await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true, message: "Order updated successfully" });
  } catch (error: any) {
    console.error("PUT update order status error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function adjustStock(db: any, items: any[], type: "increment" | "decrement") {
  const factor = type === "increment" ? 1 : -1;
  
  for (const item of items) {
    if (item.meta?.type === "custom_build" && Array.isArray(item.meta.components)) {
      // Custom PC components
      for (const comp of item.meta.components) {
        const prodId = comp.productId;
        if (prodId) {
          let qId: any = prodId;
          try {
            if (ObjectId.isValid(prodId)) qId = new ObjectId(prodId);
          } catch (e) {}
          await db.collection("products").updateOne(
            { _id: qId },
            { $inc: { stock: 1 * factor } }
          );
        }
      }
    } else if (item.productId) {
      // Standalone product
      const prodId = item.productId;
      let qId: any = prodId;
      try {
        if (ObjectId.isValid(prodId)) qId = new ObjectId(prodId);
      } catch (e) {}
      await db.collection("products").updateOne(
        { _id: qId },
        { $inc: { stock: (item.quantity || 1) * factor } }
      );
    }
  }
}
