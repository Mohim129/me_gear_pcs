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

    // Aggregated customer list with total order count
    const customers = await db
      .collection("user")
      .aggregate([
        { $match: { role: { $ne: "admin" } } },
        {
          $lookup: {
            from: "orders",
            let: { odid: { $toString: "$_id" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$userId", "$$odid"] } } },
            ],
            as: "orders",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            createdAt: 1,
            totalOrders: { $size: "$orders" },
          },
        },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    // Stats calculations
    const totalCustomers = customers.length;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeTodayUsers = await db
      .collection("orders")
      .distinct("userId", { createdAt: { $gte: startOfToday } });
    const activeToday = activeTodayUsers.length;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await db
      .collection("user")
      .countDocuments({
        role: { $ne: "admin" },
        createdAt: { $gte: startOfMonth },
      });

    return NextResponse.json({
      customers,
      stats: {
        totalCustomers,
        activeToday,
        newThisMonth,
      },
    });
  } catch (error: any) {
    console.error("Customers admin API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
