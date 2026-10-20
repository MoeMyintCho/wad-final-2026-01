import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";

export async function GET() {
  try {
    const client = await getClientPromise();
    const courses = await client
      .db()
      .collection("courses")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(courses, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to get courses" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const title = body.title?.trim();
    const description = body.description?.trim() || "";
    const instructor = body.instructor?.trim() || "";
    const price = Number(body.price ?? 0);

    if (!title) {
      return NextResponse.json(
        { message: "Course title is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { message: "Price must be a valid non-negative number" },
        { status: 400, headers: corsHeaders },
      );
    }

    const client = await getClientPromise();
    const result = await client.db().collection("courses").insertOne({
      title,
      description,
      instructor,
      price,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Course created successfully",
        course: {
          _id: result.insertedId,
          title,
          description,
          instructor,
          price,
        },
      },
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create course" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}