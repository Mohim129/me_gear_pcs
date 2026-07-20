import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // 1. Core aggregates
    const productsCount = await db.collection("products").countDocuments();
    const ordersCount = await db.collection("orders").countDocuments();
    
    // Revenue is calculated from Shipped/Delivered orders
    const completedOrders = await db
      .collection("orders")
      .find({ status: { $in: ["Shipped", "Delivered"] } })
      .toArray();

    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // Low stock count (stock <= 5)
    const lowStockCount = await db
      .collection("products")
      .countDocuments({ stock: { $lte: 5 } });

    // 2. Recent 5 orders
    const recentOrders = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // 3. Chart Data: Monthly revenue (last 6 months)
    const allOrders = await db.collection("orders").find({}).toArray();
    const monthlyDataMap: Record<string, number> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthYear = d.toLocaleString("default", { month: "short", year: "2-digit" });
      monthlyDataMap[monthYear] = 0;
    }

    allOrders.forEach((order) => {
      if (order.status !== "Cancelled") {
        const orderDate = new Date(order.createdAt);
        const monthYear = orderDate.toLocaleString("default", { month: "short", year: "2-digit" });
        if (monthYear in monthlyDataMap) {
          monthlyDataMap[monthYear] += order.totalPrice || 0;
        }
      }
    });

    const monthlyRevenue = Object.entries(monthlyDataMap).map(([name, revenue]) => ({
      name,
      revenue,
    }));

    // 4. Chart Data: Category sales distribution
    // Create product-id to category-name mapping
    const products = await db
      .collection("products")
      .find({}, { projection: { _id: 1, "category.name": 1 } })
      .toArray();
    
    const productCatMap: Record<string, string> = {};
    products.forEach((p) => {
      productCatMap[p._id.toString()] = p.category?.name || "Other";
    });

    const categorySalesMap: Record<string, number> = {};

    allOrders.forEach((order) => {
      if (order.status !== "Cancelled") {
        (order.items || []).forEach((item: any) => {
          if (item.meta?.type === "custom_build" && Array.isArray(item.meta.components)) {
            // It's a custom PC, map components inside
            item.meta.components.forEach((comp: any) => {
              const cat = productCatMap[comp.productId] || comp.slot?.toUpperCase() || "Other";
              categorySalesMap[cat] = (categorySalesMap[cat] || 0) + 1;
            });
          } else if (item.productId) {
            // Standalone product
            const cat = productCatMap[item.productId] || "Other";
            categorySalesMap[cat] = (categorySalesMap[cat] || 0) + (item.quantity || 1);
          }
        });
      }
    });

    const categorySales = Object.entries(categorySalesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalOrders: ordersCount,
        totalProducts: productsCount,
        lowStockAlerts: lowStockCount,
      },
      recentOrders,
      monthlyRevenue,
      categorySales,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
