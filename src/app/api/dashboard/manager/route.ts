// src/app/api/dashboard/manager/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/user";
import Lead from "@/models/lead";

export async function POST(req: NextRequest) {
  console.log("🟢 [Manager Dashboard] API called");

  try {
    const body = await req.json();
    console.log("📩 Request Body:", body);

    const { managerId, department } = body as { managerId: string; department: string };

    if (!managerId || !department) {
      console.warn("⚠️ Missing fields:", { managerId, department });
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    console.log("🔗 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected");

    // 🔍 Debug sample data
    const sampleEmployee = await Employee.findOne({}, { _id: 0 }).lean();
    const sampleLead = await Lead.findOne({}, { _id: 0 }).lean();
    console.log("🧾 Sample Employee Schema:", sampleEmployee);
    console.log("🧾 Sample Lead Schema:", sampleLead);

    // ✅ Employee filter using correct field
    const employeeFilter = {
      department: { $regex: new RegExp(`^${department}$`, "i") },
      createdByManagerId: managerId, // matches your schema
    };

    console.log("👥 Counting employees using filter:", employeeFilter);
    const totalEmployees = await Employee.countDocuments(employeeFilter);
    console.log("👥 Total Employees:", totalEmployees);

    // ✅ Lead filter by department
    const leadDeptFilter = { department: { $regex: new RegExp(`^${department}$`, "i") } };
    console.log("📊 Counting total leads for:", leadDeptFilter);
    const totalLeads = await Lead.countDocuments(leadDeptFilter);
    console.log("📊 Total Leads:", totalLeads);

    // ✅ Count active leads (status: "active")
    console.log("⚡ Counting active leads...");
    const activeLeads = await Lead.countDocuments({ ...leadDeptFilter, currentStatus: "active" });
    console.log("⚡ Active Leads:", activeLeads);

    // ✅ Leads in last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    console.log("📅 Calculating leads created between:", sevenDaysAgo, "→", today);
    const leadsLast7Days = await Lead.countDocuments({
      ...leadDeptFilter,
      createdAt: { $gte: sevenDaysAgo },
    });
    console.log("🗓️ Leads in last 7 days:", leadsLast7Days);

    // ✅ Daily lead trend
    console.log("📈 Preparing daily lead data...");
    const dailyLeads: { date: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const count = await Lead.countDocuments({
        ...leadDeptFilter,
        createdAt: { $gte: day, $lt: nextDay },
      });

      const formattedDate = day.toISOString().slice(5, 10); // MM-DD
      dailyLeads.push({ date: formattedDate, count });
      console.log(`📅 ${formattedDate}: ${count} leads`);
    }

    console.log("✅ Final response ready");

    return NextResponse.json({
      success: true,
      totalEmployees,
      totalLeads,
      activeLeads,
      leadsLast7Days,
      dailyLeads,
    });
  } catch (error) {
    console.error("❌ Manager Dashboard API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
