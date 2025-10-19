// src/app/api/dashboard/employee/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const filterEmployeeId = url.searchParams.get("employeeId");

    if (!filterEmployeeId) {
      // Return all leads if no employee filter
      const allLeads = await Lead.find().sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, data: allLeads });
    }

    // Fetch leads where the employee is involved anywhere
    const leads = await Lead.find({
      $or: [
        { "currentAssignedEmployee.employeeId": filterEmployeeId },
        { "sourcing.employeeId": filterEmployeeId },
        { "shipping.employeeId": filterEmployeeId },
        { "sales.employeeId": filterEmployeeId },
        { "customerService.employeeId": filterEmployeeId },
        { logs: { $elemMatch: { employeeId: filterEmployeeId } } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Fetched ${leads.length} leads for employee: ${filterEmployeeId}`);

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
