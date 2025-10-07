import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";

interface ForwardRequestBody {
  leadIds: string[];
  target: string;
  actor?: {
    employeeId?: string;
    employeeName?: string;
  };
}

function isValidStringArray(arr: unknown): arr is string[] {
  return Array.isArray(arr) && arr.every((v) => typeof v === "string");
}

// ✅ FIXED: Properly handles "employee:SO-EMP-55472|dept:sourcing" and "manager:CS-MGR-65480|dept:sales"
function parseTarget(target: string): {
  assignedId: string | null;
  assignedName: string;
  newStatus?: string;
} {
  const trimmed = target.trim();

  if (trimmed === "all") {
    return { assignedId: null, assignedName: "", newStatus: undefined };
  }

  // Manager forwarding (e.g. "manager:CS-MGR-65480|dept:sales")
  if (trimmed.startsWith("manager:")) {
    const match = trimmed.match(/^manager:([^|]+)(?:\|dept:(.+))?$/);
    if (match) {
      return {
        assignedId: match[1],
        assignedName: match[1],
        newStatus: match[2],
      };
    }
  }

  // Employee forwarding (e.g. "employee:SO-EMP-55472|dept:sourcing")
  if (trimmed.startsWith("employee:")) {
    const match = trimmed.match(/^employee:([^|]+)(?:\|dept:(.+))?$/);
    if (match) {
      return {
        assignedId: match[1],
        assignedName: match[1],
        newStatus: match[2],
      };
    }
  }

  return { assignedId: null, assignedName: "" };
}

export async function POST(req: NextRequest) {
  console.log("➡️ [Forward API] Incoming forward request...");

  await connectDB();
  console.log("✅ Database connected");

  let body: unknown;
  try {
    body = await req.json();
    console.log("📦 Request body received:", JSON.stringify(body, null, 2));
  } catch {
    console.error("❌ Invalid JSON in request body");
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    console.error("❌ Invalid request body format");
    return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 });
  }

  const { leadIds, target, actor } = body as ForwardRequestBody;
  console.log("🧾 leadIds:", leadIds);
  console.log("🎯 target:", target);
  console.log("🧑 actor:", actor);

  if (!isValidStringArray(leadIds) || typeof target !== "string" || !target) {
    console.error("❌ Missing or invalid leadIds / target");
    return NextResponse.json(
      { success: false, message: "leadIds and target are required" },
      { status: 400 }
    );
  }

  const { assignedId, assignedName, newStatus } = parseTarget(target);
  console.log("🔍 Parsed target:", { assignedId, assignedName, newStatus });

  if (assignedId === null && target.trim() !== "all") {
    console.error("❌ Invalid target format");
    return NextResponse.json({ success: false, message: "Invalid target format" }, { status: 400 });
  }

  try {
    console.log(`🔄 Processing ${leadIds.length} lead(s)...`);

    await Promise.all(
      leadIds.map(async (id) => {
        console.log(`➡️ Updating Lead ID: ${id}`);
        const lead = await Lead.findById(id);

        if (!lead) {
          console.warn(`⚠️ Lead not found: ${id}`);
          return;
        }

        // 🔁 Assign or Unassign
        if (assignedId && assignedId.trim().length > 0) {
          lead.currentAssignedEmployee = {
            employeeId: String(assignedId),
            employeeName: assignedName || String(assignedId),
          };
          console.log(`👤 Lead ${id} assigned to ${assignedName}`);
        } else {
          lead.currentAssignedEmployee = undefined;
          console.log(`🚫 Lead ${id} unassigned`);
        }

        // 📊 Update status if provided
        if (newStatus) {
          lead.currentStatus = newStatus;
          console.log(`📊 Lead ${id} status updated to: ${newStatus}`);
        }

        // 🧾 Log activity
        const commentParts: string[] = [];
        if (assignedId && assignedId.trim().length > 0) {
          commentParts.push(`Forwarded to ${assignedName}`);
        } else {
          commentParts.push("Unassigned lead");
        }
        if (newStatus) commentParts.push(`(${newStatus})`);

        const logEmployeeId = actor?.employeeId || assignedId || "system";
        const logEmployeeName = actor?.employeeName || assignedName || "system";

        lead.logs = lead.logs || [];
        lead.logs.push({
          employeeId: String(logEmployeeId),
          employeeName: String(logEmployeeName),
          timestamp: new Date(),
          comment: commentParts.join(" "),
        });

        await lead.save();
        console.log(`✅ Lead ${id} updated and saved successfully`);
      })
    );

    console.log("🎉 All leads processed successfully");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("💥 Forward API error:", err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
