export type Role = "Employee" | "Manager" | "Admin";

export interface EmployeeData {
  empId: string;
  name: string;
  role: string;
  phone: string;
  department: string;
  type: Role;
  status?: string;
  password?: string;
  location?: string;
  createdByManagerId?: string;
}
