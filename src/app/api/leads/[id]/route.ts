// src/app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";
import { Types } from "mongoose";
import { v2 as cloudinary } from "cloudinary";

/**
 * Configure Cloudinary (reads from env)
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Helpers
 */
const toObjectId = (id: unknown): Types.ObjectId | null => {
  try {
    return new Types.ObjectId(String(id));
  } catch {
    return null;
  }
};

const getPublicIdFromUrl = (url: string): string | null => {
  try {
    if (!url) return null;
    // handle query strings
    const clean = url.split("?")[0];
    const parts = clean.split("/");
    const fileWithExt = parts[parts.length - 1]; // e.g. "abc123.jpg" or "folder/abc123.jpg"
    const lastDot = fileWithExt.lastIndexOf(".");
    if (lastDot <= 0) return fileWithExt;
    return fileWithExt.substring(0, lastDot);
  } catch (err) {
    console.error("getPublicIdFromUrl error:", err);
    return null;
  }
};

/**
 * Utility to populate lead query consistently then return plain JS object
 */
const findLeadAndPopulate = async (query: Record<string, unknown>) => {
  return Lead.findOne(query)
    .populate("customerService.employeeId")
    .populate("sourcing.employeeId")
    .populate("shipping.employeeId")
    .populate("sales.employeeId")
    .populate("currentAssignedEmployee.employeeId")
    .lean();
};

/**
 * GET /api/leads/[id]
 * Accepts either a Mongo ObjectId or leadId string.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const objId = toObjectId(id);
    const query = objId ? { _id: objId } : { leadId: id };

    const lead = await findLeadAndPopulate(query);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lead }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("GET /api/leads/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/leads/[id]
 * Partial update — body must be a JSON object with fields to update.
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const payload: unknown = await req.json();
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const objId = toObjectId(id);
    const filter = objId ? { _id: objId } : { leadId: id };

    const updated = await Lead.findOneAndUpdate(filter, payload as Record<string, unknown>, {
      new: true,
    })
      .populate("customerService.employeeId")
      .populate("sourcing.employeeId")
      .populate("shipping.employeeId")
      .populate("sales.employeeId")
      .populate("currentAssignedEmployee.employeeId")
      .lean();

    if (!updated) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Lead updated successfully", lead: updated }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("PUT /api/leads/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/leads/[id]
 * Deletes Cloudinary files referenced in customerService.products.uploadFiles (if any),
 * then removes the lead document.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const objId = toObjectId(id);
    const filter = objId ? { _id: objId } : { leadId: id };

    // fetch without lean so nested arrays present — but lean is fine for reading
    const leadPlain = await Lead.findOne(filter).lean() as Record<string, unknown> | null;
    if (!leadPlain) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Safely access customerService.products (guards included)
    const cs = (leadPlain["customerService"] ?? {}) as Record<string, unknown> | undefined;
    const products = Array.isArray(cs?.["products"]) ? (cs?.["products"] as unknown[]) : [];

    for (const p of products) {
      const prod = p as Record<string, unknown>;
      const uploadFiles = Array.isArray(prod.uploadFiles) ? (prod.uploadFiles as unknown[]) : [];
      for (const f of uploadFiles) {
        const url = String(f ?? "");
        const publicId = getPublicIdFromUrl(url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
            console.log("Deleted Cloudinary file:", publicId);
          } catch (err) {
            console.error("Cloudinary delete error for", publicId, err);
            // continue deleting other files even if one fails
          }
        }
      }
    }

    // delete the lead document
    await Lead.deleteOne(filter);

    return NextResponse.json({ success: true, message: "Lead deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("DELETE /api/leads/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
