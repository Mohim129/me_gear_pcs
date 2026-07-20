import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new passwords are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const queryId = ObjectId.isValid(session.user.id)
      ? new ObjectId(session.user.id)
      : session.user.id;

    const user = await db.collection("user").findOne({ _id: queryId as any });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasExistingPassword = !!user.password;
    if (hasExistingPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db
      .collection("user")
      .updateOne(
        { _id: queryId as any },
        { $set: { password: hashedPassword } },
      );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Password change error:", message);
    return NextResponse.json(
      { error: message || "Failed to change password" },
      { status: 500 },
    );
  }
}
