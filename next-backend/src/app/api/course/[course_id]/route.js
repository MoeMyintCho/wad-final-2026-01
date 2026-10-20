import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";

export async function GET(request, { params }) {
  try {
    const { course_id } = await params;

    if (!ObjectId.isValid(course_id)) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400, headers: corsHeaders },
      );
    }

    const client = await getClientPromise();
    const course = await client.db().collection("courses").findOne({
      _id: new ObjectId(course_id),
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(course, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to get course" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { course_id } = await params;

    if (!ObjectId.isValid(course_id)) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400, headers: corsHeaders },
      );
    }

    const body = await request.json();
    const update = {};

    if (typeof body.title === "string" && body.title.trim()) {
      update.title = body.title.trim();
    }

    if (typeof body.description === "string") {
      update.description = body.description.trim();
    }

    if (typeof body.instructor === "string") {
      update.instructor = body.instructor.trim();
    }

    if (body.price !== undefined) {
      const price = Number(body.price);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { message: "Price must be a valid non-negative number" },
          { status: 400, headers: corsHeaders },
        );
      }

      update.price = price;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400, headers: corsHeaders },
      );
    }

    update.updatedAt = new Date();

    const client = await getClientPromise();
    const result = await client.db().collection("courses").updateOne(
      { _id: new ObjectId(course_id) },
      { $set: update },
    );

    if (!result.matchedCount) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { message: "Course updated successfully" },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update course" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { course_id } = await params;

    if (!ObjectId.isValid(course_id)) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400, headers: corsHeaders },
      );
    }

    const client = await getClientPromise();
    const result = await client.db().collection("courses").deleteOne({
      _id: new ObjectId(course_id),
    });

    if (!result.deletedCount) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { message: "Course deleted successfully" },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete course" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}