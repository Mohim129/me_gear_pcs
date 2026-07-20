import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, avatar } = body;

    const { db } = await connectToDatabase();
    const updateFields: Record<string, any> = {};

    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (avatar !== undefined) {
      updateFields.avatar = avatar;
      updateFields.image = avatar;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const queryId = ObjectId.isValid(session.user.id)
      ? new ObjectId(session.user.id)
      : session.user.id;

    // Better Auth uses string IDs, not ObjectId, but we handle ObjectId compatibility
    await db
      .collection("user")
      .updateOne({ _id: queryId as any }, { $set: updateFields });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queryId = ObjectId.isValid(session.user.id)
      ? new ObjectId(session.user.id)
      : session.user.id;

    const { db } = await connectToDatabase();
    const user = await db
      .collection("user")
      .findOne(
        { _id: queryId as any },
        {
          projection: {
            name: 1,
            email: 1,
            phone: 1,
            avatar: 1,
            image: 1,
            role: 1,
            createdAt: 1,
            password: 1,
          },
        },
      );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...publicUser } = user;

    return NextResponse.json({
      ...publicUser,
      avatar: user.image || user.avatar,
      hasPassword: !!password,
    });
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
