import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const client = await getClientPromise();
    const db = client.db();
    const user = await db.collection("users").findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401, headers: corsHeaders },
      );
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
        },
      },
      { status: 200, headers: corsHeaders },
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Unable to log in" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}