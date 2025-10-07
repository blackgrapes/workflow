// File: src/lib/api/authApi.ts

export type EmployeeType = "employee" | "manager" | "admin";

export interface LoginParams {
  type: EmployeeType;
  empId: string;
  password: string;
}

export interface EmployeeData {
  empId: string;
  name: string;
  type: EmployeeType;
  department?: string;
  location?: string;
}

export interface LoginResponse {
  employee: EmployeeData;
}

/**
 * Call login API
 * Token will be set in HTTP-only cookie by the server
 */
export async function loginEmployee({ type, empId, password }: LoginParams): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, empId, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Invalid credentials");
  }

  const data: LoginResponse = await res.json();

  // ✅ No localStorage, cookies handle JWT automatically

  return data;
}
