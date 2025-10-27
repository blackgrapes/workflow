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
  remark?: string;
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
  remark?: string;
  [key: string]: unknown;
}

interface ShippingInfo {
  itemName?: string;
  totalCTN?: number;
  totalCBM?: number;
  totalKG?: number;
  totalValue?: number;
  totalPCS?: number;
  hsnCode?: string;
  shipmentMode?: string;
  uploadInvoice?: string;
  uploadPackingList?: string;
  freightRate?: number;
  marka?: string;
  remark?: string;
}

interface CreateLeadBody {
  type: string;
  customerInfo?: CustomerInfo;
  products?: ProductInput[];
  shippingInfo?: Record<string, unknown>;
  employee: EmployeePayload;
}

/**
 * Helpers
 */
const safeString = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  try {
    return String(v).trim();
  } catch {
    return "";
  }
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
  return s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

/**
 * Normalize keys by lowercasing and stripping non-alphanumeric characters.
 */
const normalizeKey = (s: string): string => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

function mapShippingInfo(raw: Record<string, unknown> | undefined): ShippingInfo {
  const out: ShippingInfo = {};
  if (!raw || typeof raw !== "object") return out;

  const normalized = new Map<string, unknown>();
  for (const [k, v] of Object.entries(raw)) {
    normalized.set(normalizeKey(k), v);
  }

  const pickRaw = (variants: string[]): unknown | undefined => {
    for (const v of variants) {
      const key = normalizeKey(v);
      if (normalized.has(key)) return normalized.get(key);
    }
    return undefined;
  };

  out.itemName = safeString(pickRaw(["itemName", "item", "item name", "Item Name"]));
  out.hsnCode = safeString(pickRaw(["hsn", "hsnCode", "hsn code", "hsn_code"]));
  out.shipmentMode = safeString(pickRaw(["shipmentMode", "shipment mode", "mode", "shipment_mode"]));
  out.uploadInvoice = safeString(pickRaw(["uploadInvoice", "upload invoice", "invoice", "upload_invoice"]));
  out.uploadPackingList = safeString(pickRaw(["uploadPackingList", "upload packing list", "packing", "packing_list"]));
  out.marka = safeString(pickRaw(["marka", "mark", "brand", "shippingmark"]));
  out.remark = safeString(pickRaw(["remark", "shippingRemark", "shipping remark", "note", "notes"]));

  out.totalCTN = safeNumber(pickRaw(["totalCTN", "totalctn", "total ctn", "ctn", "total_ctn"]));
  out.totalCBM = safeNumber(pickRaw(["totalCBM", "totalcbm", "total cbm", "cbm", "total_cbm"]));
  out.totalKG = safeNumber(pickRaw(["totalKG", "totalkg", "total kg", "kg", "total_kg"]));
  out.totalValue = safeNumber(pickRaw(["totalValue", "totalvalue", "total value", "value", "total_value"]));
  out.totalPCS = safeNumber(pickRaw(["totalPCS", "totalpcs", "total pcs", "pcs", "total_pcs"]));
  out.freightRate = safeNumber(pickRaw(["freightRate", "freightrate", "freight rate", "freight_rate"]));

  return out;
}

/**
 * Recursively convert ObjectId / Date -> string for JSON-safe response
 */
function serialize(obj: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (obj === null || obj === undefined) return obj;
  const t = typeof obj;
  if (t === "string" || t === "number" || t === "boolean") return obj;
  if (Array.isArray(obj)) return obj.map((x) => serialize(x, seen));
  if (obj instanceof Date) return obj.toISOString();
  if (obj instanceof Types.ObjectId) return obj.toString();

  if (t === "object" && obj !== null) {
    const asRecord = obj as Record<string, unknown>;
    const bsontype = asRecord["_bsontype"];
    if (typeof bsontype === "string" && bsontype === "ObjectID") {
      return String(asRecord);
    }
  }

  if (t === "object" && obj !== null) {
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

  return String(obj);
}

/**
 * Inspect an uploadFiles-like array and return a small summary
 */
function summarizeUploadFiles(arr: unknown): { index: number; originalType: string; stringValue: string; isHttp: boolean }[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((v, idx) => {
    const t = typeof v;
    const s = safeString(v);
    const isHttp = s.startsWith("http://") || s.startsWith("https://");
    return { index: idx, originalType: t, stringValue: s, isHttp };
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const bodyRaw: unknown = await req.json();

    if (!bodyRaw || typeof bodyRaw !== "object") {
      console.warn("[employee-api] Invalid request body type");
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

    const body = bodyRaw as CreateLeadBody;
    const { type, customerInfo, products, shippingInfo, employee } = body;

    // Minimal runtime checks and focused logs to confirm presence of URLs
    console.log("[employee-api] Received request - type:", String(type ?? ""));
    if (employee && typeof employee === "object") {
      console.log("[employee-api] Employee mongoId present:", Boolean(employee.mongoId));
    }

    const missing: string[] = [];
    if (!type || typeof type !== "string") missing.push("type");
    if (!employee || typeof employee !== "object") missing.push("employee");
    else {
      if (!("mongoId" in employee)) missing.push("employee.mongoId");
      if (!("employeeName" in employee)) missing.push("employee.employeeName");
    }

    if (missing.length) {
      console.warn("[employee-api] Missing fields:", missing);
      return NextResponse.json({ success: false, message: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
    }

    const employeeMongoObjId = toObjectId(employee.mongoId);
    if (!employeeMongoObjId) {
      console.warn("[employee-api] Invalid employee.mongoId:", employee.mongoId);
      return NextResponse.json({ success: false, message: "Invalid employee.mongoId (not an ObjectId)" }, { status: 400 });
    }

    const legacyEmployeeId = safeString(employee.employeeId ?? employee.employeeCode ?? "");
    const normalizedType = String(type ?? "").trim().toLowerCase();

    const isCSEmployee = (() => {
      const check = (s: string) => {
        const t = s.trim().toUpperCase();
        return t.startsWith("CS") || t.startsWith("CS-") || t.startsWith("CS_EMP") || t.startsWith("CS-EMP");
      };
      if (legacyEmployeeId) {
        if (check(legacyEmployeeId)) return true;
      }
      if (typeof employee.employeeCode === "string" && check(employee.employeeCode)) return true;
      if (typeof employee.employeeId === "string" && check(employee.employeeId)) return true;
      return false;
    })();

    let currentStatus = "Shipping";
    if (isCSEmployee) currentStatus = "Customer Service";
    else if (normalizedType === "sourcing") currentStatus = "Sourcing";
    else if (normalizedType === "customer service") currentStatus = "Customer Service";
    else if (normalizedType === "shipping") currentStatus = "Shipping";

    // Products: only keep a lightweight summary to check for http URLs
    if (Array.isArray(products)) {
      const rawSummaries = products.map((p, idx) => ({
        index: idx,
        productName: safeString(p.productName ?? p.name),
        uploadFilesSummary: summarizeUploadFiles(p.uploadFiles),
      }));
      console.log("[employee-api] Products uploadFiles summary:", JSON.stringify(rawSummaries));
    } else {
      console.log("[employee-api] No products array in payload or empty");
    }

    const cust = (customerInfo ?? {}) as CustomerInfo;

    const clientMarka = safeString(cust.marka ?? cust.mark ?? "");
    const computedMarka = (() => {
      const n = safeString(cust.customerName).trim().toUpperCase();
      const c = safeString(cust.city).trim().toUpperCase();
      if (n && c) return `DTC-${n[0]}${c[0]}`;
      return "";
    })();
    const finalMarkaBase = clientMarka || computedMarka || "";

    let finalMarka = finalMarkaBase;
    if (finalMarkaBase) {
      try {
        const regex = new RegExp(`^${escapeRegex(finalMarkaBase)}(\\d*)?$`, "i");
        const existingDocs = await Lead.find({
          "customerService.marka": { $regex: regex },
        }).lean();
        const existing = Array.isArray(existingDocs) ? existingDocs : [];

        if (existing.length > 0) {
          const currentContact = safeString(cust.contactNumber);
          const sameContactExists = existing.some((docUnknown) => {
            const doc = docUnknown as Record<string, unknown>;
            const cs = doc["customerService"] as Record<string, unknown> | undefined;
            const existingContact = safeString(cs?.contactNumber);
            return existingContact && existingContact === currentContact;
          });
          if (!sameContactExists) {
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
          } else {
            finalMarka = finalMarkaBase;
          }
        } else {
          finalMarka = finalMarkaBase;
        }
      } catch (err) {
        console.warn("[employee-api] marka computation failed:", err);
        finalMarka = finalMarkaBase;
      }
    }

    const sourceForShipping: Record<string, unknown> | undefined =
      shippingInfo && typeof shippingInfo === "object"
        ? shippingInfo
        : (customerInfo as Record<string, unknown> | undefined);

    const mappedShipping = mapShippingInfo(sourceForShipping);

    // Focused log for shipping URLs only
    console.log("[employee-api] Shipping URLs:", {
      uploadInvoice: mappedShipping.uploadInvoice,
      uploadPackingList: mappedShipping.uploadPackingList,
    });

    const baseSection = {
      employeeMongoId: employeeMongoObjId,
      employeeId: legacyEmployeeId || null,
      managerId: null,
      logs: [] as unknown[],
    };

    const leadId = `LEAD-${Date.now()}`;

    const leadData: Record<string, unknown> = {
      leadId,
      currentStatus,
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
        products: Array.isArray(products)
          ? products.map((p) => ({
              productName: safeString(p.productName ?? p.name),
              quantity: safeNumber(p.quantity ?? p.qty),
              size: safeString(p.size),
              usage: safeString(p.usage),
              targetPrice: safeNumber(p.targetPrice ?? p.price),
              uploadFiles:
                Array.isArray(p.uploadFiles) && p.uploadFiles.length
                  ? (p.uploadFiles as unknown[])
                      .map((u) => safeString(u))
                      .map((s) => s.replace(/\s+/g, " "))
                      .filter((s) => s.length > 0 && (s.startsWith("http://") || s.startsWith("https://")))
                  : [],
              remark: safeString((p as ProductInput).remark ?? ""),
            }))
          : [],
        remark: safeString(cust.remark ?? ""),
      },

      sourcing: {
        ...baseSection,
        productName: safeString(cust.customerName ?? ""),
        companyName: safeString(cust.companyName ?? ""),
        companyAddress: safeString(cust.companyAddress ?? ""),
        supplierName: "",
        supplierContactNumber: "",
        productDetail: "",
        productCatalogue: "",
        productUnitPrice: 0,
        uploadDocuments: [] as string[],
        remark: safeString(cust.remark ?? ""),
      },

      shipping: {
        ...baseSection,
        itemName: safeString(mappedShipping.itemName),
        totalCTN: mappedShipping.totalCTN ?? 0,
        totalCBM: mappedShipping.totalCBM ?? 0,
        totalKG: mappedShipping.totalKG ?? 0,
        totalValue: mappedShipping.totalValue ?? 0,
        totalPCS: mappedShipping.totalPCS ?? 0,
        hsnCode: safeString(mappedShipping.hsnCode),
        shipmentMode: safeString(mappedShipping.shipmentMode),
        uploadInvoice: safeString(mappedShipping.uploadInvoice),
        uploadPackingList: safeString(mappedShipping.uploadPackingList),
        freightRate: mappedShipping.freightRate ?? 0,
        marka: safeString(mappedShipping.marka ?? finalMarka),
        remark: safeString(mappedShipping.remark ?? cust.remark ?? ""),
      },

      sales: {
        ...baseSection,
        trackingNumber: "",
        warehouseReceipt: "",
        remark: safeString(cust.remark ?? ""),
      },
    };

    const newLead = new (Lead as unknown as { new (doc?: Record<string, unknown>): unknown })(leadData);

    type SaveableDocument = { save: () => Promise<Record<string, unknown>> };

    let saved: Record<string, unknown> | null = null;
    if (newLead && typeof (newLead as SaveableDocument).save === "function") {
      try {
        saved = await (newLead as SaveableDocument).save();
        console.log("[employee-api] Lead saved:", leadId);
      } catch (saveErr) {
        console.error("[employee-api] Save error:", saveErr);
        const errMessage = (saveErr as Error).message ?? "Save failed";
        return NextResponse.json({ success: false, message: errMessage, error: String(saveErr) }, { status: 500 });
      }
    } else {
      console.error("[employee-api] newLead does not have save() function");
      return NextResponse.json({ success: false, message: "Internal server error: invalid model" }, { status: 500 });
    }

    const out = serialize(saved ?? newLead);

    // Return minimal debug in non-prod so frontend dev can inspect helpful fields
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        success: true,
        data: out,
        debug: {
          leadId,
          finalMarka,
          shippingUrls: {
            uploadInvoice: mappedShipping.uploadInvoice,
            uploadPackingList: mappedShipping.uploadPackingList,
          },
        },
      }, { status: 201 });
    }

    return NextResponse.json({ success: true, data: out }, { status: 201 });
  } catch (err) {
    console.error("POST /api/employee error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
