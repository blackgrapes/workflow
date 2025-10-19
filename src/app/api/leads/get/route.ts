// src/app/api/leads/get/route.ts
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

/**
 * Represents the shape of the documents returned by .lean()
 * Keep fields optional because DB documents may miss some fields.
 */
interface FetchedLead {
  _id?: string | { toString(): string };
  leadId?: string;
  currentStatus?: string;
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
    const employeeId = searchParams.get("employeeId"); // session.mongoId
    const employeeCode = searchParams.get("employeeCode"); // session.employeeId / code
    const department = searchParams.get("department");
    const role = searchParams.get("role"); // 🔹 Now receiving role from frontend

    console.log("🔹 Query Params Received:", { employeeId, employeeCode, department, role });

    // 🟩 If role is admin → return ALL leads, no filter
    if (role && role.toLowerCase() === "admin") {
      console.log("🟩 Admin detected — Fetching all leads without filters");
      const allLeads = (await Lead.find({}).lean().exec()) as FetchedLead[];

      const leads: LeadDoc[] = allLeads.map((s: FetchedLead) => ({
        _id: s._id ? (typeof s._id === "string" ? s._id : s._id.toString()) : "",
        leadId: s.leadId ?? "",
        currentStatus: s.currentStatus ?? "",
        currentAssignedEmployee: s.currentAssignedEmployee ?? undefined,
        customerService: s.customerService ?? undefined,
        sourcing: s.sourcing ?? undefined,
        shipping: s.shipping ?? undefined,
        sales: s.sales ?? undefined,
      }));

      console.log("📦 Admin fetched total leads:", leads.length);
      console.groupEnd();
      return NextResponse.json({ success: true, count: leads.length, leads }, { status: 200 });
    }

    // 🟨 For non-admin users — existing logic
    if (!department || (!employeeId && !employeeCode)) {
      console.groupEnd();
      return NextResponse.json(
        { success: false, message: "department and (employeeId or employeeCode) are required" },
        { status: 400 }
      );
    }

    // Normalize department so "Customer Service", "customer service" or "customerservice" all match.
    // We replace spaces in the incoming department with \s* in the regex so that DB values with or without spaces match.
    const deptPattern = department.replace(/\s+/g, "\\s*");
    const regexStatus = new RegExp(`^${deptPattern}$`, "i");

    // Helper to create $or clauses
    const makeFieldEntries = (fieldPath: string): Record<string, string>[] => {
      const entries: Record<string, string>[] = [];
      if (employeeId) entries.push({ [fieldPath]: employeeId });
      if (employeeCode) {
        const codeField = fieldPath.replace(/\.employeeId$/, ".employeeCode");
        const nameField = fieldPath.replace(/\.employeeId$/, ".employeeName");
        const managerField = fieldPath.replace(/\.employeeId$/, ".managerId");
        // try matching code against multiple possible fields
        entries.push({ [fieldPath]: employeeCode }); // sometimes employeeId field stored as code
        entries.push({ [codeField]: employeeCode });
        entries.push({ [nameField]: employeeCode });
        entries.push({ [managerField]: employeeCode }); // sometimes managerId stores the manager-code
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
    const dedupedOr = orClauses.filter((c) => {
      const key = JSON.stringify(c);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (dedupedOr.length === 0) {
      console.log("⚠️ No valid $or clauses were built — returning empty result");
      console.groupEnd();
      return NextResponse.json({ success: true, count: 0, leads: [] }, { status: 200 });
    }

    const query = {
      $or: dedupedOr,
      currentStatus: regexStatus,
    };

    // Logging note: JSON.stringify hides RegExp content, so log both separately for clarity
    console.log("🧠 Built $or clauses:", JSON.stringify(dedupedOr, null, 2));
    console.log("🧠 currentStatus regex:", regexStatus.toString());

    // Fetch leads (typed)
    const fetchedLeads = (await Lead.find(query).lean().exec()) as FetchedLead[];
    const leads: LeadDoc[] = fetchedLeads.map((s: FetchedLead) => ({
      _id: s._id ? (typeof s._id === "string" ? s._id : s._id.toString()) : "",
      leadId: s.leadId ?? "",
      currentStatus: s.currentStatus ?? "",
      currentAssignedEmployee: s.currentAssignedEmployee ?? undefined,
      customerService: s.customerService ?? undefined,
      sourcing: s.sourcing ?? undefined,
      shipping: s.shipping ?? undefined,
      sales: s.sales ?? undefined,
    }));

    console.log("📦 Leads fetched:", leads.length);

    // Diagnostics if no leads
    let diagnostics: LeadDoc[] | null = null;
    if (leads.length === 0) {
      try {
        const samples = (await Lead.find({ currentStatus: regexStatus }).limit(5).lean().exec()) as FetchedLead[];
        diagnostics = samples.map((s: FetchedLead) => ({
          _id: s._id ? (typeof s._id === "string" ? s._id : s._id.toString()) : "",
          leadId: s.leadId ?? "",
          currentStatus: s.currentStatus ?? "",
          currentAssignedEmployee: s.currentAssignedEmployee ?? undefined,
          customerService: s.customerService ?? undefined,
          sourcing: s.sourcing ?? undefined,
          shipping: s.shipping ?? undefined,
          sales: s.sales ?? undefined,
        }));
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
