// src/app/api/dashboard/admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";
import Employee from "@/models/user";

// Minimal typed shapes (adjust fields if your schemas differ)
interface EmployeeShape {
  _id: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  designation?: string;
  email?: string;
  phone?: string;
  createdAt?: Date;
}

export async function GET() {
  try {
    await connectDB();

    // Date for last 7 days calculation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ---------------------------
    // 1) Employees grouped by department
    // ---------------------------
    const employeesByDepartment = await Employee.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$department", "Unknown"] },
          employees: {
            $push: {
              _id: "$_id",
              employeeId: "$employeeId",
              employeeName: "$employeeName",
              department: "$department",
              designation: "$designation",
              email: "$email",
              phone: "$phone",
              createdAt: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          employees: 1,
          count: 1,
        },
      },
      { $sort: { department: 1 } },
    ]);

    // ---------------------------
    // Helper pipeline snippet for leads grouping by departments (all time)
    // Strategy:
    //  - Build 'departments' array from various employee refs
    //  - $unwind departments
    //  - group by department
    // ---------------------------
    const leadsByDepartment = await Lead.aggregate([
      {
        $addFields: {
          departments: {
            $setUnion: [
              {
                $cond: [
                  { $ifNull: ["$currentAssignedEmployee.department", false] },
                  ["$currentAssignedEmployee.department"],
                  [],
                ],
              },
              {
                $cond: [
                  { $ifNull: ["$sourcing.department", false] },
                  ["$sourcing.department"],
                  [],
                ],
              },
              {
                $cond: [
                  { $ifNull: ["$shipping.department", false] },
                  ["$shipping.department"],
                  [],
                ],
              },
              {
                $cond: [
                  { $ifNull: ["$sales.department", false] },
                  ["$sales.department"],
                  [],
                ],
              },
              {
                $cond: [
                  { $ifNull: ["$customerService.department", false] },
                  ["$customerService.department"],
                  [],
                ],
              },
              // Also include currentStatus if you use status names that match department names
              {
                $cond: [{ $ifNull: ["$currentStatus", false] }, ["$currentStatus"], []],
              },
            ],
          },
        },
      },
      { $unwind: "$departments" },
      {
        $group: {
          _id: "$departments",
          leads: {
            $push: {
              _id: "$_id",
              leadId: "$leadId",
              currentStatus: "$currentStatus",
              currentAssignedEmployee: "$currentAssignedEmployee",
              sourcing: "$sourcing",
              shipping: "$shipping",
              sales: "$sales",
              customerService: "$customerService",
              createdAt: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          leads: 1,
          count: 1,
        },
      },
      { $sort: { department: 1 } },
    ]);

    // ---------------------------
    // 3) Leads grouped by department but ONLY for last 7 days
    // ---------------------------
    const leadsByDepartmentLast7Days = await Lead.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } },
      },
      {
        $addFields: {
          departments: {
            $setUnion: [
              {
                $cond: [
                  { $ifNull: ["$currentAssignedEmployee.department", false] },
                  ["$currentAssignedEmployee.department"],
                  [],
                ],
              },
              {
                $cond: [
                  { $ifNull: ["$sourcing.department", false] },
                  ["$sourcing.department"],
                  [],
                ],
              },
              {
                $cond: [
                  { $ifNull: ["$shipping.department", false] },
                  ["$shipping.department"],
                  [],
                ],
              },
              {
                $cond: [
                  { $ifNull: ["$sales.department", false] },
                  ["$sales.department"],
                  [],
                ],
              },
              {
                $cond: [
                  { $ifNull: ["$customerService.department", false] },
                  ["$customerService.department"],
                  [],
                ],
              },
              {
                $cond: [{ $ifNull: ["$currentStatus", false] }, ["$currentStatus"], []],
              },
            ],
          },
        },
      },
      { $unwind: "$departments" },
      {
        $group: {
          _id: "$departments",
          leads: {
            $push: {
              _id: "$_id",
              leadId: "$leadId",
              currentStatus: "$currentStatus",
              currentAssignedEmployee: "$currentAssignedEmployee",
              createdAt: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          leads: 1,
          count: 1,
        },
      },
      { $sort: { department: 1 } },
    ]);

    // ---------------------------
    // 4) Overall totals & summary
    // ---------------------------
    const totalLeadsPromise = Lead.countDocuments();
    const totalEmployeesPromise = Employee.countDocuments();
    const recentLeadsCountPromise = Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const [totalLeads, totalEmployees, recentLeadsCount] = await Promise.all([
      totalLeadsPromise,
      totalEmployeesPromise,
      recentLeadsCountPromise,
    ]);

    // ---------------------------
    // 5) Return assembled payload
    // ---------------------------
    return NextResponse.json({
      success: true,
      data: {
        totals: {
          totalLeads,
          totalEmployees,
          leadsLast7Days: recentLeadsCount,
        },
        employeesByDepartment, // [{ department, employees[], count }, ...]
        leadsByDepartment, // [{ department, leads[], count }, ...]
        leadsByDepartmentLast7Days, // [{ department, leads[], count }, ...]
      },
    });
  } catch (error) {
    console.error("Admin Dashboard Aggregation Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
