// /app/api/leads/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";

// Strict Lead types
interface EmployeeRef {
  employeeId?: string;
  employeeCode?: string;
  employeeName?: string;
}

interface LeadDoc {
  _id: string;
  leadId: string;
  currentStatus: string;
  currentAssignedEmployee?: EmployeeRef;
  customerService?: EmployeeRef;
  sourcing?: EmployeeRef;
  shipping?: EmployeeRef;
  sales?: EmployeeRef;
}

export async function GET(req: NextRequest) {
  console.group("🟦 [API] GET /api/leads/get Debug Log");

  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");   // session.mongoId
    const employeeCode = searchParams.get("employeeCode"); // session.employeeId / code
    const department = searchParams.get("department");

    console.log("🔹 Query Params Received:", { employeeId, employeeCode, department });

    if (!department || (!employeeId && !employeeCode)) {
      console.groupEnd();
      return NextResponse.json(
        { success: false, message: "department and (employeeId or employeeCode) are required" },
        { status: 400 }
      );
    }

    // Case-insensitive exact match
    const regexStatus = new RegExp(`^${department}$`, "i");

    // Helper to create $or clauses
    const makeFieldEntries = (fieldPath: string): Record<string, string>[] => {
      const entries: Record<string, string>[] = [];
      if (employeeId) entries.push({ [fieldPath]: employeeId });
      if (employeeCode) {
        const codeField = fieldPath.replace(/\.employeeId$/, ".employeeCode");
        const nameField = fieldPath.replace(/\.employeeId$/, ".employeeName");
        entries.push({ [fieldPath]: employeeCode });
        entries.push({ [codeField]: employeeCode });
        entries.push({ [nameField]: employeeCode });
      }
      return entries;
    };

    const fields = [
      "currentAssignedEmployee.employeeId",
      "customerService.employeeId",
      "sourcing.employeeId",
      "shipping.employeeId",
      "sales.employeeId",
    ];

    let orClauses: Record<string, string>[] = [];
    for (const f of fields) {
      orClauses = orClauses.concat(makeFieldEntries(f));
    }

    // Remove duplicates
    const seen = new Set<string>();
    const dedupedOr = orClauses.filter(c => {
      const key = JSON.stringify(c);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const query = {
      $or: dedupedOr,
      currentStatus: regexStatus,
    };

    console.log("🧠 Built Query Object:", JSON.stringify(query, null, 2));

    // Fetch leads (typed as unknown[], then mapped to strict LeadDoc[])
    const fetchedLeads = await Lead.find(query).lean().exec() as unknown[];

    const leads: LeadDoc[] = fetchedLeads.map((s) => {
      const obj = s as Record<string, any>;
      return {
        _id: obj._id?.toString() || "",
        leadId: obj.leadId || "",
        currentStatus: obj.currentStatus || "",
        currentAssignedEmployee: obj.currentAssignedEmployee || undefined,
        customerService: obj.customerService || undefined,
        sourcing: obj.sourcing || undefined,
        shipping: obj.shipping || undefined,
        sales: obj.sales || undefined,
      };
    });

    console.log("📦 Leads fetched:", leads.length);

    // Diagnostics if no leads
    let diagnostics: LeadDoc[] | null = null;
    if (leads.length === 0) {
      try {
        const samples = await Lead.find({ currentStatus: regexStatus }).limit(5).lean().exec() as unknown[];
        diagnostics = samples.map((s) => {
          const obj = s as Record<string, any>;
          return {
            _id: obj._id?.toString() || "",
            leadId: obj.leadId || "",
            currentStatus: obj.currentStatus || "",
            currentAssignedEmployee: obj.currentAssignedEmployee || undefined,
            customerService: obj.customerService || undefined,
            sourcing: obj.sourcing || undefined,
            shipping: obj.shipping || undefined,
            sales: obj.sales || undefined,
          };
        });
      } catch (diagErr) {
        console.error("❌ Diagnostics fetch failed:", diagErr);
        diagnostics = null;
      }
    }

    console.groupEnd();
    return NextResponse.json({ success: true, count: leads.length, leads, diagnostics }, { status: 200 });

  } catch (err) {
    console.error("❌ Error in GET /api/leads/get:", err);
    console.groupEnd();
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: String(err) },
      { status: 500 }
    );
  }
}
