import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";

export async function GET() {
  try {
    const client = await getClientPromise();
    const users = await client
      .db()
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    return NextResponse.json(users, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to get users" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    if (!username?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400, headers: corsHeaders },
      );
    }

    const client = await getClientPromise();
    const users = client.db().collection("users");
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await users.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409, headers: corsHeaders },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: result.insertedId.toString(),
          username: username.trim(),
          email: normalizedEmail,
        },
      },
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}