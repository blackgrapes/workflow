import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  console.group("🟦 [API] GET /api/leads/get Debug Log");

  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const department = searchParams.get("department");

    console.log("🔹 Query Params Received:");
    console.log("   • employeeId:", employeeId);
    console.log("   • department:", department);

    if (!employeeId || !department) {
      console.log("❌ Missing employeeId or department");
      console.groupEnd();
      return NextResponse.json(
        { success: false, message: "employeeId and department are required" },
        { status: 400 }
      );
    }

    const deptKey = department.toLowerCase().replace(/\s+/g, "");
    const regexStatus = new RegExp(department, "i");

    // ✅ Build query dynamically
    const idCondition = Types.ObjectId.isValid(employeeId)
      ? new Types.ObjectId(employeeId)
      : employeeId;

    const query = {
      $or: [
        { "currentAssignedEmployee.employeeId": idCondition },
        { "customerService.employeeId": idCondition },
        { "sourcing.employeeId": idCondition },
        { "shipping.employeeId": idCondition },
        { "sales.employeeId": idCondition },
      ],
      currentStatus: regexStatus,
    };

    console.log("🧠 Built Query Object:", JSON.stringify(query, null, 2));

    const leads = await Lead.find(query).lean().exec();

    console.log("📦 Leads fetched:", leads.length);
    if (leads.length === 0) console.warn("⚠️ No leads found for query");

    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        count: leads.length,
        leads,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching leads:", error);
    console.groupEnd();
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
