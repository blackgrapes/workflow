// src/app/api/employee/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/lead";
import { Types } from "mongoose";

/**
 * Payload / internal types
 */
interface ProductInput {
  productName?: string;
  name?: string;
  quantity?: number | string;
  qty?: number | string;
  size?: string;
  usage?: string;
  targetPrice?: number | string;
  price?: number | string;
  uploadFiles?: unknown[];
}

interface EmployeePayload {
  mongoId: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName: string;
}

interface CustomerInfo {
  marka?: string;
  mark?: string;
  customerName?: string;
  city?: string;
  contactNumber?: string;
  address?: string;
  state?: string;
  companyName?: string;
  companyAddress?: string;
}

interface ShippingInfo {
  itemName?: string;
  totalCTN?: number | string;
  totalCBM?: number | string;
  totalKG?: number | string;
  totalValue?: number | string;
  totalPCS?: number | string;
  hsnCode?: string;
  shipmentMode?: string;
  uploadInvoice?: string;
  uploadPackingList?: string;
  freightRate?: number | string;
  marka?: string;
}

interface CreateLeadBody {
  type: string;
  customerInfo?: CustomerInfo;
  products?: ProductInput[];
  shippingInfo?: ShippingInfo;
  employee: EmployeePayload;
}

/**
 * Helpers
 */
const safeString = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  return String(v);
};

const safeNumber = (v: unknown): number => {
  if (v === undefined || v === "" || v === null) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const toObjectId = (id: unknown): Types.ObjectId | null => {
  try {
    return new Types.ObjectId(String(id));
  } catch {
    return null;
  }
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Recursively convert ObjectId / Date -> string for JSON-safe response
 * Protects against circular references using WeakSet.
 */
function serialize(obj: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  // primitives / null / undefined
  if (obj === null || obj === undefined) return obj;
  const t = typeof obj;
  if (t === "string" || t === "number" || t === "boolean") return obj;

  // arrays
  if (Array.isArray(obj)) {
    return obj.map((x) => serialize(x, seen));
  }

  // dates
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Mongoose ObjectId (instanceof check)
  if (obj instanceof Types.ObjectId) {
    return obj.toString();
  }

  // duck-typed ObjectId (lean objects or serialized forms)
  if (t === "object" && obj !== null) {
    // use a typed view to safely access properties without 'in' operator
    const asRecord = obj as Record<string, unknown>;
    const bsontype = asRecord["_bsontype"];
    if (typeof bsontype === "string" && bsontype === "ObjectID") {
      return String(asRecord);
    }
  }

  // objects (including plain objects and Mongoose documents)
  if (t === "object" && obj !== null) {
    // prevent infinite recursion on circular refs
    if (seen.has(obj as object)) {
      return "[Circular]";
    }
    seen.add(obj as object);

    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      out[key] = serialize(value, seen);
    }
    return out;
  }

  // fallback
  return String(obj);
}

/**
 * POST /api/employee
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const bodyRaw: unknown = await req.json();
    console.log("DEBUG: Incoming body:", JSON.stringify(bodyRaw || {}, null, 2));

    if (!bodyRaw || typeof bodyRaw !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const body = bodyRaw as CreateLeadBody;

    const { type, customerInfo, products, shippingInfo, employee } = body;

    // Basic validation
    const missing: string[] = [];
    if (!type || typeof type !== "string") missing.push("type");
    if (!employee || typeof employee !== "object") missing.push("employee");
    else {
      if (!("mongoId" in employee)) missing.push("employee.mongoId");
      if (!("employeeName" in employee)) missing.push("employee.employeeName");
    }

    if (missing.length) {
      return NextResponse.json(
        { success: false, message: `Missing fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const employeeMongoObjId = toObjectId(employee.mongoId);
    if (!employeeMongoObjId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid employee.mongoId (not an ObjectId)",
        },
        { status: 400 }
      );
    }

    const legacyEmployeeId = safeString(employee.employeeId ?? employee.employeeCode ?? "");

    // Map products safely
    const mappedProducts: {
      productName: string;
      quantity: number;
      size: string;
      usage: string;
      targetPrice: number;
      uploadFiles: string[];
    }[] =
      Array.isArray(products) && products.length
        ? products.map((p) => {
            const uploadFiles =
              Array.isArray(p.uploadFiles) && p.uploadFiles.length
                ? (p.uploadFiles as unknown[]).map((u) => safeString(u)).filter((u) => u.startsWith("http"))
                : [];
            return {
              productName: safeString(p.productName ?? p.name),
              quantity: safeNumber(p.quantity ?? p.qty),
              size: safeString(p.size),
              usage: safeString(p.usage),
              targetPrice: safeNumber(p.targetPrice ?? p.price),
              uploadFiles,
            };
          })
        : [];

    // Compute marka (preferred from client, otherwise auto)
    const cust = (customerInfo ?? {}) as CustomerInfo;
    const clientMarka = safeString(cust.marka ?? cust.mark ?? "");
    const computedMarka = (() => {
      const n = safeString(cust.customerName).trim().toUpperCase();
      const c = safeString(cust.city).trim().toUpperCase();
      if (n && c) return `DTC-${n[0]}${c[0]}`;
      return "";
    })();
    const finalMarkaBase = clientMarka || computedMarka || "";

    // Ensure unique marka when same marka exists but different contact number
    let finalMarka = finalMarkaBase;
    if (finalMarkaBase) {
      try {
        const regex = new RegExp(`^${escapeRegex(finalMarkaBase)}(\\d*)?$`, "i");

        // Query existing leads whose customerService.marka matches regex
        const existingDocs = await Lead.find({
          "customerService.marka": { $regex: regex },
        }).lean();

        const existing = Array.isArray(existingDocs) ? (existingDocs as unknown[]) : [];

        if (existing.length > 0) {
          const currentContact = safeString(cust.contactNumber);
          const sameContactExists = existing.some((docUnknown) => {
            const doc = docUnknown as Record<string, unknown>;
            const cs = doc["customerService"] as Record<string, unknown> | undefined;
            const existingContact = safeString(cs?.contactNumber);
            return existingContact && existingContact === currentContact;
          });

          if (!sameContactExists) {
            // compute highest numeric suffix among existing markas (base counts as 1)
            let maxNum = 0;
            for (const docUnknown of existing) {
              const doc = docUnknown as Record<string, unknown>;
              const cs = doc["customerService"] as Record<string, unknown> | undefined;
              const mk = safeString(cs?.marka);
              if (!mk) continue;
              const m = mk.match(new RegExp(`^${escapeRegex(finalMarkaBase)}(\\d*)$`, "i"));
              if (m) {
                const s = m[1] || "";
                const num = s === "" ? 1 : Number(s);
                if (!Number.isNaN(num) && num > maxNum) maxNum = num;
              }
            }
            const nextNum = maxNum + 1 || 2;
            finalMarka = `${finalMarkaBase}${nextNum}`;
            console.log(`DEBUG: Marka collision found. Generated new marka: ${finalMarka}`);
          } else {
            finalMarka = finalMarkaBase;
          }
        } else {
          finalMarka = finalMarkaBase;
        }
      } catch (err) {
        console.warn("WARNING: marka uniqueness check failed, using base marka. Error:", err);
        finalMarka = finalMarkaBase;
      }
    }

    // Build base "employee section" that includes both mongoId and legacy id
    const baseSection = {
      employeeMongoId: employeeMongoObjId,
      employeeId: legacyEmployeeId || null,
      managerId: null,
      logs: [] as unknown[],
    };

    // Create lead object
    const leadId = `LEAD-${Date.now()}`;

    const leadData: Record<string, unknown> = {
      leadId,
      currentStatus: String(type).toLowerCase() === "sourcing" ? "Customer Service" : "Shipping",
      currentAssignedEmployee: {
        employeeMongoId: employeeMongoObjId,
        employeeId: legacyEmployeeId || null,
        employeeName: safeString(employee.employeeName),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      logs: [
        {
          employeeMongoId: employeeMongoObjId,
          employeeId: legacyEmployeeId || null,
          employeeName: safeString(employee.employeeName),
          timestamp: new Date(),
          comment: `Created by ${safeString(employee.employeeName)}${legacyEmployeeId ? ` (${legacyEmployeeId})` : ""}`,
        },
      ],

      customerService: {
        ...baseSection,
        customerName: safeString(cust.customerName),
        contactNumber: safeString(cust.contactNumber),
        address: safeString(cust.address),
        city: safeString(cust.city),
        state: safeString(cust.state),
        marka: finalMarka,
        products: mappedProducts,
      },

      sourcing: {
        ...baseSection,
        productName: "",
        companyName: safeString(cust.companyName ?? ""),
        companyAddress: safeString(cust.companyAddress ?? ""),
        supplierName: "",
        supplierContactNumber: "",
        productDetail: "",
        productCatalogue: "",
        productUnitPrice: 0,
        uploadDocuments: [] as string[],
      },

      shipping: {
        ...baseSection,
        itemName: safeString((shippingInfo ?? {}).itemName),
        totalCTN: safeNumber((shippingInfo ?? {}).totalCTN),
        totalCBM: safeNumber((shippingInfo ?? {}).totalCBM),
        totalKG: safeNumber((shippingInfo ?? {}).totalKG),
        totalValue: safeNumber((shippingInfo ?? {}).totalValue),
        totalPCS: safeNumber((shippingInfo ?? {}).totalPCS),
        hsnCode: safeString((shippingInfo ?? {}).hsnCode),
        shipmentMode: safeString((shippingInfo ?? {}).shipmentMode),
        uploadInvoice: safeString((shippingInfo ?? {}).uploadInvoice),
        uploadPackingList: safeString((shippingInfo ?? {}).uploadPackingList),
        freightRate: safeNumber((shippingInfo ?? {}).freightRate),
        marka: safeString((shippingInfo ?? {}).marka ?? finalMarka),
      },

      sales: {
        ...baseSection,
        trackingNumber: "",
        warehouseReceipt: "",
      },
    };

    // If products were provided, also add them at top-level `products` for query convenience
    if (mappedProducts.length) {
      leadData.products = mappedProducts;
    }

    // Save
    const newLead = new (Lead as unknown as { new (doc?: Record<string, unknown>): unknown })(leadData);

    // minimal typed wrapper for something that has a .save() returning a plain object
    type SaveableDocument = { save: () => Promise<Record<string, unknown>> };

    let saved: Record<string, unknown> | null = null;
    if (newLead && typeof (newLead as SaveableDocument).save === "function") {
      saved = await (newLead as SaveableDocument).save();
    }

    const out = serialize(saved ?? newLead);

    console.info("Lead created:", (out as Record<string, unknown>)?.leadId ?? leadId);
    return NextResponse.json({ success: true, data: out }, { status: 201 });
  } catch (err) {
    console.error("POST /api/employee error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
