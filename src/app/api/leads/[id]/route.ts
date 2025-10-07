// src/app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Lead from "@/models/lead";

// ✅ MongoDB connect helper
const connectToDB = async () => {
  if (mongoose.connection.readyState === 1) return; // Already connected
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("MongoDB connected");
  } catch (err: unknown) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

// Context type for route handlers
interface Context {
  params?: { id?: string } | Promise<{ id?: string }>;
}

// Helper to normalize context.params (Next.js 15+ can return Promise)
const getParams = async (
  params?: { id?: string } | Promise<{ id?: string }>
): Promise<{ id?: string }> => {
  if (!params) return {};
  // Type-safe check for Promise
  if (typeof (params as { then?: unknown }).then === "function") {
    return await params;
  }
  return params;
};

// GET /api/leads/:id
export async function GET(req: NextRequest, context: Context) {
  try {
    const params = await getParams(context?.params);
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    await connectToDB();

    const lead = await Lead.findById(id)
      .populate("customerService.employeeId")
      .populate("sourcing.employeeId")
      .populate("shipping.employeeId")
      .populate("sales.employeeId")
      .populate("currentAssignedEmployee.employeeId")
      .lean();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("GET /api/leads/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/leads/:id
export async function PUT(req: NextRequest, context: Context) {
  try {
    const params = await getParams(context?.params);
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    await connectToDB();

    const updatedData = await req.json();

    const lead = await Lead.findByIdAndUpdate(id, updatedData, { new: true })
      .populate("customerService.employeeId")
      .populate("sourcing.employeeId")
      .populate("shipping.employeeId")
      .populate("sales.employeeId")
      .populate("currentAssignedEmployee.employeeId")
      .lean();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Lead updated successfully", lead }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("PUT /api/leads/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
