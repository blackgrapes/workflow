import { Lead } from "@/types/leads";

export interface CustomerInquiryPayload {
  type: "sourcing" | "shipping";
  customerInfo: unknown;
  products?: unknown;
  shippingInfo?: unknown;
  employee?: {
    employeeId?: string;
    employeeName?: string;
  };
}

export async function submitCustomerInquiry(payload: CustomerInquiryPayload) {
  try {
    const response = await fetch("/api/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to submit inquiry");

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Customer Inquiry submit error:", err);
    throw err;
  }
}

// Example in /lib/api/leads.ts
export async function getEmployeeLeads(employeeMongoId: string) {
  try {
    const res = await fetch(`/api/employee/${employeeMongoId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error fetching leads");
    return data.leads;
  } catch (err) {
    console.error("Error fetching employee leads:", err);
    return [];
  }
}

// src/lib/frontendApis/leads/apis.ts
export async function getLeadById(id: string): Promise<Lead | null> {
  if (!id) return null;
  const res = await fetch(`/api/leads/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) {
    console.error("getLeadById failed:", res.statusText);
    return null;
  }
  return (await res.json()) as Lead;
}
// /lib/frontendApis/employees/apis.ts
interface ForwardLeadsResponse {
  success: boolean;
  message?: string;
}

/**
 * Forward leads to a target (employee or manager)
 * @param leadIds Array of lead _id strings
 * @param target Target string: "employee:<id>", "manager:<id>|dept:<department>", or "all"
 * @returns {Promise<ForwardLeadsResponse>}
 */
export const forwardLeads = async (
  leadIds: string[],
  target: string
): Promise<ForwardLeadsResponse> => {
  if (!leadIds.length || !target) {
    throw new Error("leadIds and target are required");
  }

  try {
    const res = await fetch("/api/leads/forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds, target }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to forward leads");
    }

    const data: ForwardLeadsResponse = await res.json();
    return data;
 } catch (err: unknown) {
  if (err instanceof Error) {
    console.error("Forward leads error:", err.message);
    throw err; // re-throw the original error
  } else {
    console.error("Forward leads error:", err);
    throw new Error("Unknown error occurred while forwarding leads");
  }
}

};

/**
 * Fetch leads assigned to a specific employee & department
 * @param employeeId MongoDB ObjectId string of the employee
 * @param department Department name (e.g., "Customer Service")
 * @returns {Promise<Lead[]>}
 */
// example wrapper
export async function getForwardEmployeeLeads(mongoId: string | null, department: string, employeeCode?: string) {
  const params = new URLSearchParams();
  if (mongoId) params.append("employeeId", mongoId);
  if (employeeCode) params.append("employeeCode", employeeCode);
  params.append("department", department);

  const res = await fetch(`/api/leads/get?${params.toString()}`, { cache: "no-store" });
  return res.ok ? (await res.json()) : null;
}


// upload file to cloudinary global api 
// upload file to cloudinary global api 
// Upload file to Cloudinary with type detection and debug logs
export async function uploadToCloudinary(
  file: File,
  options?: { folder?: string }
): Promise<string> {
  // Strict TypeScript: returns Promise<string> (secure URL)
  try {
    console.log("🚀 Upload started:", file.name, "(", file.type, ")");

    // Helper: sanitize filename (keeps ascii letters, numbers, dot, dash, underscore)
    const getSafeFileName = (name: string): string => {
      // keep extension, replace other chars with underscore
      const parts = name.split(".");
      if (parts.length === 1) {
        return name.replace(/[^a-zA-Z0-9_\-]/g, "_");
      }
      const ext = parts.pop();
      const base = parts.join(".");
      const safeBase = base.replace(/[^a-zA-Z0-9_\-]/g, "_");
      // limit length to avoid extremely long public_ids
      const maxBaseLen = 120;
      const trimmedBase = safeBase.length > maxBaseLen ? safeBase.slice(0, maxBaseLen) : safeBase;
      return `${trimmedBase}.${ext}`;
    };

    // Validate cloud name
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error("Cloudinary cloud name is not defined (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME).");
    }

    // Validate upload preset (for unsigned uploads). If you use signed uploads this must be handled server-side.
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

    // Detect resource type: prefer extension fallback if file.type is empty/incorrect
    const lowerType = (file.type || "").toLowerCase();
    const nameLower = file.name.toLowerCase();
    const ext = nameLower.split(".").pop() ?? "";

    const isPdf = lowerType.includes("pdf") || ext === "pdf";
    const isImage = lowerType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);
    const isVideo = lowerType.startsWith("video/") || ["mp4", "mov", "mkv"].includes(ext);

    // For PDF/docs make sure Cloudinary treats them as 'raw'
    const resourceType = isPdf || (!isImage && !isVideo && ext.length > 0 && ext !== "svg") ? "raw" : "auto";

    // Build endpoint URL (resourceType in path)
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    // Build FormData correctly — include sanitized filename to avoid special char problems
    const safeName = getSafeFileName(file.name);
    const formData = new FormData();
    // Append file with explicit filename
    formData.append("file", file, safeName);
    formData.append("upload_preset", uploadPreset);

    // Optional folder
    if (options?.folder) {
      formData.append("folder", options.folder);
    }

    // Optional: keep original filename as public_id prefix to help identify files (timestamp prevents collisions)
    // But do not set public_id with unsafe characters; if you want to set public_id uncomment below:
    // const publicId = `${safeName.replace(/\.[^/.]+$/, "")}_${Date.now()}`;
    // formData.append("public_id", publicId);

    // Execute request
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      // try to extract JSON error body if present
      const text = await res.text();
      // include status and body for easier debugging
      throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} — ${text}`);
    }

    // Parse response
    const data = (await res.json()) as {
      secure_url?: string;
      url?: string;
      resource_type?: string;
      bytes?: number;
      public_id?: string;
      [key: string]: unknown;
    };

    const fileUrl = (data.secure_url || data.url) as string | undefined;
    if (!fileUrl) {
      throw new Error("Cloudinary response did not include a secure URL.");
    }

    // Debug logs
    console.log(
      isPdf ? "📄 Uploaded PDF successfully:" : isImage ? "🖼️ Uploaded image successfully:" : "📁 Uploaded other file type successfully:",
      fileUrl
    );
    console.log("✅ Cloudinary upload complete:", {
      name: file.name,
      safeName,
      type: file.type,
      sizeKB: (file.size / 1024).toFixed(2) + " KB",
      url: fileUrl,
      resourceType: data.resource_type ?? resourceType,
      bytes: data.bytes ?? null,
      public_id: data.public_id ?? null,
    });

    // Final verification: if we uploaded a PDF, ensure Cloudinary stored it as 'raw'
    if (isPdf && String(data.resource_type || resourceType) !== "raw") {
      console.warn("Uploaded PDF but Cloudinary reported resource_type !== 'raw'. URL may not render as PDF in-browser.");
    }

    return fileUrl;
  } catch (err) {
    console.error("❌ uploadToCloudinary error:", err);
    throw err;
  }
}




export interface DepartmentPayload {
  employeeId: string;
  department: string;
  data: Record<string, unknown>; // dynamic — works for all departments
  logs?: Record<string, unknown>[];
}
export async function submitDepartmentData(
  payload: DepartmentPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/leads/update`, {
      method: "PUT", // ✅ changed from POST to PUT
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("submitDepartmentData failed:", res.statusText);
      return { success: false, message: res.statusText };
    }

    return (await res.json()) as { success: boolean; message: string };
  } catch (err) {
    console.error("submitDepartmentData error:", err);
    return { success: false, message: "Network error" };
  }
}
