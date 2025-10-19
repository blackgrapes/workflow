import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";
import { Types } from "mongoose";

// ---------------------
// Helpers
// ---------------------
const safeString = (value: unknown) => (value ? String(value) : "");
const safeNumber = (value: unknown) =>
  value !== undefined && value !== "" ? Number(value) : 0;
const toObjectId = (id: unknown) => {
  try {
    return new Types.ObjectId(String(id));
  } catch {
    return null;
  }
};

// ---------------------
// PUT /api/employee/shipment
// ---------------------
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { leadId, employeeId, managerId, shipping } = body as {
      leadId?: string;
      employeeId?: string;
      managerId?: string;
      shipping?: {
        itemName?: string;
        shipmentMode?: string;
        freightRate?: number;
      };
    };

    if (!leadId) {
      return NextResponse.json(
        { success: false, message: "leadId is required" },
        { status: 400 }
      );
    }

    if (!shipping || typeof shipping !== "object") {
      return NextResponse.json(
        { success: false, message: "Shipping data is required" },
        { status: 400 }
      );
    }

    // Fetch lead
    const lead = await Lead.findOne({ _id: toObjectId(leadId) });
    if (!lead) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    // Update shipping section
    lead.shipping = {
      ...lead.shipping,
      itemName: safeString(shipping.itemName),
      shipmentMode: safeString(shipping.shipmentMode),
      freightRate: safeNumber(shipping.freightRate),
    };

    // Add a log entry
    lead.shipping.logs.push({
      employeeId: employeeId || "SYSTEM",
      employeeName: managerId || "SYSTEM",
      comment: "Shipping details updated",
      timestamp: new Date(),
    });

    await lead.save();

    return NextResponse.json(
      {
        success: true,
        message: "Shipping updated successfully",
        shipping: lead.shipping,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating shipping:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
