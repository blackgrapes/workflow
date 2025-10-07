import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Extract employeeId from URL
    const url = new URL(req.url);
    const segments = url.pathname.split("/"); 
    const employeeId = segments[segments.length - 1];

    console.log("🔹 Employee ID from URL:", employeeId);

    if (!employeeId) {
      return NextResponse.json(
        { message: "Missing employee ID" },
        { status: 400 }
      );
    }

    // Check if it's a valid ObjectId
    const isObjectId = Types.ObjectId.isValid(employeeId);
    const empObjectId = isObjectId ? new Types.ObjectId(employeeId) : null;

    // Debug info
    console.log("🔹 Is ObjectId:", isObjectId);

    // Query leads — handle both ObjectId and string cases
    const leads = await Lead.find({
      $or: [
        // If stored as ObjectId
        ...(empObjectId
          ? [
              { "customerService.employeeId": empObjectId },
              { "sourcing.employeeId": empObjectId },
              { "shipping.employeeId": empObjectId },
              { "sales.employeeId": empObjectId },
              { "currentAssignedEmployee.employeeId": empObjectId },
            ]
          : []),
        // If stored as string
        { "customerService.employeeId": employeeId },
        { "sourcing.employeeId": employeeId },
        { "shipping.employeeId": employeeId },
        { "sales.employeeId": employeeId },
        { "currentAssignedEmployee.employeeId": employeeId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`🔹 Leads found: ${leads.length}`);

    return NextResponse.json({ leads }, { status: 200 });
  } catch (err) {
    console.error("GET /api/employee/[id] error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
