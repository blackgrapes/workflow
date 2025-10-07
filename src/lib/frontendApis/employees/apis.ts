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
  } catch (err: any) {
    console.error("Forward leads error:", err.message);
    throw err;
  }
};

/**
 * Fetch leads assigned to a specific employee & department
 * @param employeeId MongoDB ObjectId string of the employee
 * @param department Department name (e.g., "Customer Service")
 * @returns {Promise<Lead[]>}
 */
export const getForwardEmployeeLeads = async (
  employeeId: string,
  department: string
): Promise<Lead[]> => {
  if (!employeeId || !department) {
    throw new Error("employeeId and department are required");
  }

  try {
    const res = await fetch(
      `/api/leads/get?employeeId=${employeeId}&department=${department}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch leads");
    }

    const data = await res.json();
    return data.leads || [];
  } catch (err: any) {
    console.error("Error fetching leads:", err.message);
    throw err;
  }
};
