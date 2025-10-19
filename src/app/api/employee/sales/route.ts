// app/api/employee/sales/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LeadModel from "@/models/lead"; // adjust path if needed
import { SalesFormData } from "@/app/employee/component/departmentDetailsUpdate/salesForm";

// 🔹 MongoDB connection helper
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("MongoDB connected");
};

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    console.log("POST /api/employee/sales payload:", body);

    const {
      leadId,
      employeeId,
      employeeName,
      managerId,
      salesData,
    }: {
      leadId: string;
      employeeId: string;
      employeeName: string;
      managerId: string | null;
      salesData: SalesFormData | SalesFormData["products"]; // accept array or object
    } = body;

    // 🔹 Basic validations
    if (!leadId) {
      console.error("Missing leadId");
      return NextResponse.json({ success: false, message: "leadId is required" }, { status: 400 });
    }

    if (!employeeId) {
      console.error("Missing employeeId");
      return NextResponse.json({ success: false, message: "employeeId is required" }, { status: 400 });
    }

    // 🔹 Normalize salesData to have { products: [...] }
    const normalizedSalesData: SalesFormData =
      Array.isArray(salesData) ? { products: salesData } : salesData;

    if (!normalizedSalesData.products || normalizedSalesData.products.length === 0) {
      console.error("No products in salesData");
      return NextResponse.json({ success: false, message: "No sales products provided" }, { status: 400 });
    }

    // 🔹 Find the lead by MongoDB ObjectId
    const lead = await LeadModel.findById(leadId);
    if (!lead) {
      console.error("Lead not found:", leadId);
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }

    // 🔹 Extract the first product to save as lead.sales
    const firstProduct = normalizedSalesData.products[0];
    console.log("Saving sales:", firstProduct);

    lead.sales = {
      trackingNumber: firstProduct.trackingNumber,
      warehouseReceipt: firstProduct.warehouseReceipt,
      employeeId,
      managerId: managerId || undefined,
      logs: [
        ...(lead.sales?.logs || []),
        {
          employeeId,
          employeeName,
          timestamp: new Date(),
          comment: "Sales data updated",
        },
      ],
    };

    await lead.save();
    console.log("Lead saved successfully:", leadId);

    return NextResponse.json({ success: true, message: "Sales data saved successfully" });
  } catch (err) {
    console.error("Sales API error:", err);
    return NextResponse.json(
      { success: false, message: "Server error saving sales data" },
      { status: 500 }
    );
  }
}
