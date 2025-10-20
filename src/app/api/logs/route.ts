// src/app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";

// Type definitions matching your Lead schema
interface EmployeeRef {
  employeeId?: string;
  employeeName?: string;
}

interface DepartmentLogs {
  logs?: {
    employeeId: string;
    employeeName: string;
    timestamp: string;
    comment: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

interface LeadDoc {
  _id: string;
  leadId: string;
  currentStatus?: string;
  currentAssignedEmployee?: EmployeeRef;
  customerService?: DepartmentLogs;
  sourcing?: DepartmentLogs;
  shipping?: DepartmentLogs;
  sales?: DepartmentLogs;
  logs?: {
    employeeId: string;
    employeeName: string;
    timestamp: string;
    comment: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

interface SearchRequestBody {
  query: string; // Lead ID or Marka
  userId: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body: SearchRequestBody = await req.json();
    const { query, userId, role } = body;

    if (!query || !userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Search by leadId or customerService.marka
    const lead = (await Lead.findOne({
      $or: [{ leadId: query }, { "customerService.marka": query }],
    }).lean()) as LeadDoc | null;

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Aggregate logs from all departments
    const aggregatedLogs: {
      employeeId: string;
      employeeName: string;
      timestamp: string;
      comment: string;
      department: string;
    }[] = [];

    const addDepartmentLogs = (
      deptLogs: DepartmentLogs | undefined,
      departmentName: string
    ) => {
      if (deptLogs?.logs?.length) {
        deptLogs.logs.forEach((log) => {
          aggregatedLogs.push({ ...log, department: departmentName });
        });
      }
    };

    addDepartmentLogs(lead.customerService, "Customer Service");
    addDepartmentLogs(lead.sourcing, "Sourcing");
    addDepartmentLogs(lead.shipping, "Shipping");
    addDepartmentLogs(lead.sales, "Sales");

    // Add main lead-level logs if any
    if (lead.logs?.length) {
      lead.logs.forEach((log) => {
        aggregatedLogs.push({ ...log, department: "General" });
      });
    }

    // Sort by timestamp descending
    aggregatedLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return lead details with aggregated logs
    const leadResponse = {
      _id: lead._id,
      leadId: lead.leadId,
      currentStatus: lead.currentStatus || null,
      currentAssignedEmployee: lead.currentAssignedEmployee || null,
      customerService: lead.customerService || null,
      sourcing: lead.sourcing || null,
      shipping: lead.shipping || null,
      sales: lead.sales || null,
      logs: aggregatedLogs,
    };

    return NextResponse.json(leadResponse);
  } catch (err) {
    console.error("API /api/logs error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
