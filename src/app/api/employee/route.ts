import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";
import { Types } from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// ---------------------
// Cloudinary config
// ---------------------
cloudinary.config({
  secure: true, // use HTTPS
  // CLOUDINARY_URL from .env is automatically used
});

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
// Helper to upload file to Cloudinary
// ---------------------
const uploadFile = async (file: string | Blob) => {
  const buffer =
    file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : Buffer.from(file);
  return new Promise<string>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: "uploads" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || "");
      }
    );
    upload.end(buffer);
  });
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    console.log("i got your request")
    const body: unknown = await req.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      type,
      customerInfo,
      products,
      shippingInfo,
      employee,
    } = body as Record<string, unknown>;

    if (
      !type ||
      typeof type !== "string" ||
      !employee ||
      typeof employee !== "object" ||
      !("mongoId" in employee) ||
      !("employeeName" in employee)
    ) {
      return NextResponse.json(
        { message: "Missing required employee or type info" },
        { status: 400 }
      );
    }

    const employeeRecord = employee as Record<string, unknown>;
    const leadId = "LEAD-" + Date.now();
    const employeeObjectId = toObjectId(employeeRecord.mongoId);
    if (!employeeObjectId) {
      return NextResponse.json(
        { message: "Invalid employee MongoDB ID" },
        { status: 400 }
      );
    }

    const baseSection = {
      employeeId: employeeObjectId,
      managerId: null,
      logs: [],
    };

    // ---------------------
    // Upload product files to Cloudinary if present
    // ---------------------
    const mappedProducts =
      Array.isArray(products) && products.length > 0
        ? await Promise.all(
            products.map(async (p) => {
              const prod = p as Record<string, unknown>;
              const files = Array.isArray(prod.uploadFiles) ? prod.uploadFiles : [];
              const uploadedFiles: string[] = [];

              for (const f of files) {
                try {
                  const url = await uploadFile(f as string | Blob);
                  if (url) uploadedFiles.push(url);
                } catch (err) {
                  console.error("File upload failed:", err);
                }
              }

              return {
                productName: safeString(prod.name),
                quantity: safeNumber(prod.qty),
                size: safeString(prod.size),
                usage: safeString(prod.usage),
                targetPrice: safeNumber(prod.price),
                uploadFiles: uploadedFiles,
              };
            })
          )
        : [];

    const leadData = {
      leadId,
      currentStatus: type === "sourcing" ? "Customer Service" : "Shipping",
      currentAssignedEmployee: {
        employeeId: employeeObjectId,
        employeeName: safeString(employeeRecord.employeeName),
      },
      logs: [],
      customerService: {
        ...baseSection,
        customerName: safeString(
          (customerInfo as Record<string, unknown>)?.customerName
        ),
        contactNumber: safeString(
          (customerInfo as Record<string, unknown>)?.contactNumber
        ),
        address: safeString(
          (customerInfo as Record<string, unknown>)?.address
        ),
        city: safeString((customerInfo as Record<string, unknown>)?.city),
        state: safeString((customerInfo as Record<string, unknown>)?.state),
        products: mappedProducts,
      },
      sourcing: {
        ...baseSection,
        productName: "",
        companyName: "",
        companyAddress: "",
        supplierName: "",
        supplierContactNumber: "",
        productDetail: "",
        productCatalogue: "",
        productUnitPrice: 0,
        uploadDocuments: [],
      },
      shipping: {
        ...baseSection,
        itemName: safeString(
          (shippingInfo as Record<string, unknown>)?.itemName
        ),
        totalCTN: safeNumber(
          (shippingInfo as Record<string, unknown>)?.totalCTN
        ),
        totalCBM: safeNumber(
          (shippingInfo as Record<string, unknown>)?.totalCBM
        ),
        totalKG: safeNumber(
          (shippingInfo as Record<string, unknown>)?.totalKG
        ),
        totalValue: safeNumber(
          (shippingInfo as Record<string, unknown>)?.totalValue
        ),
        totalPCS: safeNumber(
          (shippingInfo as Record<string, unknown>)?.totalPCS
        ),
        hsnCode: safeString(
          (shippingInfo as Record<string, unknown>)?.hsnCode
        ),
        shipmentMode: safeString(
          (shippingInfo as Record<string, unknown>)?.shipmentMode
        ),
        uploadInvoice: safeString(
          (shippingInfo as Record<string, unknown>)?.uploadInvoice
        ),
        uploadPackingList: safeString(
          (shippingInfo as Record<string, unknown>)?.uploadPackingList
        ),
        freightRate: 0,
      },
      sales: {
        ...baseSection,
        trackingNumber: "",
        warehouseReceipt: "",
      },
    };

    const newLead = new Lead(leadData);
    await newLead.save();

    return NextResponse.json(
      { message: "Lead created successfully", lead: newLead },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Unexpected POST /api/employee error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
