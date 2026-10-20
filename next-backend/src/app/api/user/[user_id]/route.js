import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";

export async function GET(request, { params }) {
  try {
    const { user_id } = await params;

    if (!ObjectId.isValid(user_id)) {
      return NextResponse.json(
        { message: "Invalid user ID" },
        { status: 400, headers: corsHeaders },
      );
    }

    const client = await getClientPromise();
    const user = await client.db().collection("users").findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0 } },
    );

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to get user" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user_id } = await params;

    if (!ObjectId.isValid(user_id)) {
      return NextResponse.json(
        { message: "Invalid user ID" },
        { status: 400, headers: corsHeaders },
      );
    }

    const body = await request.json();
    const update = {};

    if (typeof body.username === "string" && body.username.trim()) {
      update.username = body.username.trim();
    }

    if (typeof body.email === "string" && body.email.trim()) {
      update.email = body.email.trim().toLowerCase();
    }

    if (typeof body.password === "string" && body.password.length >= 6) {
      update.password = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400, headers: corsHeaders },
      );
    }

    const client = await getClientPromise();
    const users = client.db().collection("users");

    if (update.email) {
      const duplicate = await users.findOne({
        email: update.email,
        _id: { $ne: new ObjectId(user_id) },
      });

      if (duplicate) {
        return NextResponse.json(
          { message: "Email already in use" },
          { status: 409, headers: corsHeaders },
        );
      }
    }

    const result = await users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: update },
    );

    if (!result.matchedCount) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { message: "User updated successfully" },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user_id } = await params;

    if (!ObjectId.isValid(user_id)) {
      return NextResponse.json(
        { message: "Invalid user ID" },
        { status: 400, headers: corsHeaders },
      );
    }

    const client = await getClientPromise();
    const result = await client
      .db()
      .collection("users")
      .deleteOne({ _id: new ObjectId(user_id) });

    if (!result.deletedCount) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}