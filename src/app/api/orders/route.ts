import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";
    const isAdmin = session.user.role === "admin";

    const { db } = await connectToDatabase();
    const query = (showAll && isAdmin) ? {} : { userId: session.user.id };
    const orders = await db.collection("orders").find(query).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, shippingAddress, totalPrice } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zip) {
      return NextResponse.json(
        { error: "Complete shipping address is required (fullName, phone, street, city, zip)" },
        { status: 400 }
      );
    }

    if (!totalPrice || totalPrice <= 0) {
      return NextResponse.json(
        { error: "Invalid total price" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Build order items and decrement stock
    const orderItems: any[] = [];

    for (const item of items) {
      if (item.type === "custom_build") {
        // Custom build – store as single order item with meta
        const componentDetails: any[] = [];

        if (item.components && typeof item.components === "object") {
          for (const [slot, comp] of Object.entries(item.components)) {
            const component = comp as { id: string; name: string; price: number };
            componentDetails.push({
              slot,
              productId: component.id,
              name: component.name,
              price: component.price,
            });

            // Decrement stock for each component product
            await db.collection("products").updateOne(
              { _id: component.id as any, stock: { $gt: 0 } },
              { $inc: { stock: -1 } }
            );
          }
        }

        orderItems.push({
          productId: null,
          name: item.name || "Custom PC Build",
          quantity: 1,
          price: item.price,
          image: item.image || null,
          meta: {
            type: "custom_build",
            components: componentDetails,
          },
        });
      } else {
        // Standalone product
        orderItems.push({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image || null,
        });

        // Decrement stock
        await db.collection("products").updateOne(
          { _id: item.id as any, stock: { $gt: 0 } },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    const order = {
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state || "",
        zip: shippingAddress.zip,
      },
      paymentMethod: "Cash on Delivery",
      totalPrice,
      status: "Pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(order);

    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...order,
    });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
