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
export async function uploadToCloudinary(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"
    );

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) throw new Error("Cloudinary cloud name is not defined");

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Cloudinary upload failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.secure_url as string;
  } catch (err) {
    console.error("uploadToCloudinary error:", err);
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
