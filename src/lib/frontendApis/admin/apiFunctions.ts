import { EmployeeData } from "@/types/user";

// this api for create employee
export const createEmployee = async (employeeData: EmployeeData) => {
  try {
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeeData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to create employee");
    }

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    console.error("Create Employee API Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(message);
  }
};

// Fetch all employees
export async function fetchAllEmployees(): Promise<EmployeeData[]> {
  try {
    const res = await fetch("/api/admin/employees");
    if (!res.ok) {
      throw new Error("Failed to fetch employees");
    }
    const data = await res.json();
    return data;
  } catch (err: unknown) {
    console.error("fetchAllEmployees Error:", err);
    return [];
  }
}

// Fetch employees created by a specific manager
export async function fetchEmployeesByManager(managerId: string): Promise<EmployeeData[]> {
  try {
    const res = await fetch(`/api/admin/employees?managerId=${managerId}`);
    if (!res.ok) {
      throw new Error("Failed to fetch employees by manager");
    }
    const data = await res.json();
    return data;
  } catch (err: unknown) {
    console.error("fetchEmployeesByManager Error:", err);
    return [];
  }
}

// Delete employee
export async function deleteEmployee(empId: string): Promise<{ message: string }> {
  const res = await fetch("/api/admin/employees", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete employee");
  return data;
}

// Fetch single employee by empId
export async function fetchEmployee(empId: string): Promise<EmployeeData> {
  const res = await fetch(`/api/admin/employees/${empId}`);
  if (!res.ok) throw new Error("Failed to fetch employee");
  return res.json();
}

// Update employee
export async function updateEmployee(employee: EmployeeData): Promise<{ message: string }> {
  const res = await fetch(`/api/admin/employees/${employee.empId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employee),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update employee");
  return data;
}
