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
    const settings = await db.collection("settings").findOne({ slug: "store_config" });

    return NextResponse.json(settings || {
      storeName: "MEG PCs",
      supportEmail: "support@megears.com",
      currency: "BDT",
    });
  } catch (error: any) {
    console.error("GET settings API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { storeName, supportEmail, currency } = body;

    const { db } = await connectToDatabase();
    await db.collection("settings").updateOne(
      { slug: "store_config" },
      {
        $set: {
          storeName,
          supportEmail,
          currency,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error: any) {
    console.error("PUT settings API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
