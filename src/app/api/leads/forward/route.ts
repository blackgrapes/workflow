import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";

/**
 * Body shape for the forward API. The request should contain an array of
 * MongoDB document identifiers (`leadIds`) and a `target` describing
 * who the leads are being forwarded to. An optional `actor` may be
 * supplied to record who initiated the forward action in the lead logs.
 */
interface ForwardRequestBody {
  leadIds: string[];
  target: string; // "manager:<id>|dept:<department>", "employee:<id>" or "all"
  actor?: {
    employeeId?: string;
    employeeName?: string;
  };
}

/**
 * Simple helper to assert that a value is an array of strings. Mongoose
 * validation will reject any other type, so normalising early avoids
 * confusing error messages.
 */
function isValidStringArray(arr: unknown): arr is string[] {
  return Array.isArray(arr) && arr.every((v) => typeof v === "string");
}

/**
 * Parse the `target` field and extract the assigned employee identifier,
 * an optional employee/manager name and an optional new status. When
 * forwarding to "all" the function returns `null` for the id to indicate
 * that the current assignment should be cleared.
 */
function parseTarget(target: string): {
  assignedId: string | null;
  assignedName: string;
  newStatus?: string;
} {
  const trimmed = target.trim();
  if (trimmed === "all") {
    return { assignedId: null, assignedName: "", newStatus: undefined };
  }

  // Forward to a manager, e.g. "manager:CS-MGR-123|dept:customerService"
  if (trimmed.startsWith("manager:")) {
    const [managerPart, deptPart] = trimmed.split("|");
    const managerCode = managerPart.split(":")[1] ?? "";
    let department: string | undefined;
    if (deptPart && deptPart.startsWith("dept:")) {
      department = deptPart.split(":")[1];
    }
    return { assignedId: managerCode, assignedName: managerCode, newStatus: department };
  }

  // Forward to a specific employee, e.g. "employee:12345"
  if (trimmed.startsWith("employee:")) {
    const empId = trimmed.split(":")[1] ?? "";
    return { assignedId: empId, assignedName: empId, newStatus: undefined };
  }

  // Invalid targets will be handled by the route handler
  return { assignedId: null, assignedName: "" };
}

/**
 * API route for forwarding leads to another employee or manager. This
 * endpoint updates the `currentAssignedEmployee` and optionally the
 * `currentStatus` on each lead. A log entry is appended recording
 * who performed the action and the destination of the forward.
 */
export async function POST(req: NextRequest) {
  await connectDB();

  // Attempt to read and validate the request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 });
  }

  const { leadIds, target, actor } = body as ForwardRequestBody;
  if (!isValidStringArray(leadIds) || typeof target !== "string" || !target) {
    return NextResponse.json({ success: false, message: "leadIds and target are required" }, { status: 400 });
  }

  // Interpret the target string into assignment parameters
  const { assignedId, assignedName, newStatus } = parseTarget(target);
  if (assignedId === null && target.trim() !== "all") {
    // parseTarget returns null for id only when target is "all"; any other
    // scenario that yields null should be considered invalid
    return NextResponse.json({ success: false, message: "Invalid target format" }, { status: 400 });
  }

  try {
    await Promise.all(
      leadIds.map(async (id) => {
        const lead = await Lead.findById(id);
        if (!lead) return;

        // When assignedId is provided (non-null/undefined/empty string) set
        // currentAssignedEmployee; otherwise remove the assignment
        if (assignedId && assignedId.trim().length > 0) {
          lead.currentAssignedEmployee = {
            employeeId: String(assignedId),
            employeeName: assignedName || String(assignedId),
          };
        } else {
          lead.currentAssignedEmployee = undefined;
        }

        // Update the status if a department was provided
        if (newStatus) {
          lead.currentStatus = newStatus;
        }

        // Build a descriptive comment for the log entry
        const commentParts: string[] = [];
        if (assignedId && assignedId.trim().length > 0) {
          commentParts.push(`Forwarded to ${assignedName}`);
        } else {
          commentParts.push("Unassigned lead");
        }
        if (newStatus) {
          commentParts.push(`(${newStatus})`);
        }

        // Determine who is recorded as performing the forward. If the caller
        // supplied an actor, use their details; otherwise fall back to the
        // assigned destination (so you know who initiated) or 'system'.
        const logEmployeeId = actor?.employeeId || assignedId || "system";
        const logEmployeeName = actor?.employeeName || assignedName || "system";

        // Append the new log entry. Ensure employeeId is a string to avoid
        // Mongoose attempting to cast it to an ObjectId. The schema for logs
        // requires a string for employeeId and employeeName.
        lead.logs = lead.logs || [];
        lead.logs.push({
          employeeId: String(logEmployeeId),
          employeeName: String(logEmployeeName),
          timestamp: new Date(),
          comment: commentParts.join(" "),
        });

        await lead.save();
      })
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("Forward API error:", err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
