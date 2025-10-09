import { NextRequest, NextResponse } from "next/server";
import LeadModel, { Sourcing } from "@/models/lead";
import mongoose from "mongoose";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ leadId?: string }> } // ✅ Note the Promise<>
): Promise<NextResponse> {
  try {
    console.log("[Sourcing PUT] Request received");

    const body = await req.json();
    console.log("[Sourcing PUT] Request body:", body);

    // Resolve params promise
    const resolvedParams = await context.params;
    const leadId = resolvedParams?.leadId || body.leadId;
    console.log("[Sourcing PUT] leadId determined:", leadId);

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    // Determine whether leadId is ObjectId or custom string
    let lead;
    if (mongoose.Types.ObjectId.isValid(leadId)) {
      lead = await LeadModel.findById(leadId);
    } else {
      lead = await LeadModel.findOne({ leadId }); // for custom LEAD-xxxxx
    }

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const sourcingData: Sourcing = body.data;

    if (!sourcingData?.companyName || !sourcingData?.supplierName || !sourcingData?.productDetail) {
      return NextResponse.json(
        { error: "Company name, Supplier name, and Product detail are required" },
        { status: 400 }
      );
    }

    // Merge new data into existing sourcing
    lead.sourcing = { ...lead.sourcing, ...sourcingData };

    await lead.save();
    console.log("[Sourcing PUT] Lead saved");

    return NextResponse.json({
      message: "Sourcing updated successfully",
      sourcing: lead.sourcing,
    });
  } catch (err) {
    console.error("[Sourcing PUT] Error:", err);
    return NextResponse.json({ error: "Failed to update sourcing" }, { status: 500 });
  }
}
