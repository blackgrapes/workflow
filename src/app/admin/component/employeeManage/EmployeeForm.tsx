"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  generateEmployeeId,
  generatePassword,
} from "../../../../lib/frontendFunctions/admin/UtilsFunction";
import { EmployeeData as GlobalEmployeeData, Role } from "@/types/user";
import { validateEmployeeForm } from "../../../../lib/frontendFunctions/admin/employeeValidation";

// Only allow Manager or Employee in the form (exclude Admin)
export type EmployeeType = Exclude<Role, "Admin">;

interface EmployeeFormProps {
  onSubmit?: (employeeData: GlobalEmployeeData) => void;
  type: "admin" | "manager"; // form creator type
  department?: string; // when creator is manager, their department
  managerId?: string;
  defaultValues?: GlobalEmployeeData; // For edit mode
}

const DEPARTMENTS = ["Sales", "Shipment", "Customer Service", "Sourcing"];
const EMPLOYEE_TYPES = ["Employee", "Manager"];

export default function EmployeeForm({
  onSubmit,
  type,
  department,
  managerId,
  defaultValues,
}: EmployeeFormProps) {
  const isEditMode = Boolean(defaultValues);
  const isCreatorManager = type === "manager";

  // keep UI identical: labels above, inputs styled as before
  const [form, setForm] = useState({
    name: defaultValues?.name || "",
    role: defaultValues?.role || "",
    phone: defaultValues?.phone || "",
    location: defaultValues?.location || "",
    // include department & employeeType in state so selects show current value
    department: defaultValues?.department || department || DEPARTMENTS[0],
    employeeType: (defaultValues?.type as EmployeeType) || (isCreatorManager ? "Employee" : EMPLOYEE_TYPES[0]),
  });

  const [errors, setErrors] = useState({
    name: "",
    role: "",
    phone: "",
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // validate using your external validator which expects { name, role, phone, location }
const { valid, errors: validationErrors } = validateEmployeeForm({
  name: form.name,
  role: form.role,
  phone: form.phone,
  location: form.location,
});

    setErrors(validationErrors);
    if (!valid) return;

    setLoading(true);

    // Final department/type logic:
    // - If editing => keep defaultValues' department/type (can't change)
    // - Else if creator is manager => department fixed to department prop, type fixed to Employee
    // - Else admin creating => use selected values in form
    const finalDepartment = defaultValues?.department || (isCreatorManager ? department || form.department : form.department);
    const finalType = defaultValues?.type ? (defaultValues.type as EmployeeType) : (isCreatorManager ? ("Employee" as EmployeeType) : (form.employeeType as EmployeeType));

    const employeeData: GlobalEmployeeData = {
      empId: defaultValues?.empId || generateEmployeeId(finalDepartment, finalType),
      password: defaultValues?.password || generatePassword(),
      status: defaultValues?.status || "Active",
      name: form.name,
      role: form.role,
      phone: form.phone,
      department: finalDepartment,
      type: finalType,
      location: form.location,
      createdByManagerId:
        defaultValues?.createdByManagerId || (isCreatorManager ? managerId || "admin" : "admin"),
    };

    try {
      if (onSubmit) onSubmit(employeeData);

      alert(
        `✅ Employee ${defaultValues ? "Updated" : "Created"}!\n\nID: ${
          employeeData.empId
        }\nPassword: ${employeeData.password}\nType: ${
          employeeData.type
        }\nDepartment: ${employeeData.department}\nLocation: ${
          employeeData.location
        }\nCreated By: ${employeeData.createdByManagerId}`
      );

      router.push("/admin/employees");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving employee!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Full Name (label above) */}
      <div className="flex flex-col">
        <label htmlFor="full-name" className="mb-1 font-medium text-gray-700">Full Name</label>
        <input
          id="full-name"
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
          className={`border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.name ? "border-red-500" : ""}`}
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Role / Designation */}
      <div className="flex flex-col">
        <label htmlFor="role" className="mb-1 font-medium text-gray-700">Role / Designation</label>
        <input
          id="role"
          type="text"
          placeholder="Role / Designation"
          value={form.role}
          onChange={(e) => handleChange("role", e.target.value)}
          required
          className={`border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.role ? "border-red-500" : ""}`}
        />
        {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role}</p>}
      </div>

      {/* Phone */}
      <div className="flex flex-col">
        <label htmlFor="phone" className="mb-1 font-medium text-gray-700">Phone</label>
        <input
          id="phone"
          type="text"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          required
          className={`border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.phone ? "border-red-500" : ""}`}
        />
        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
      </div>

      {/* Department (select) - styled same as inputs so UI remains same */}
      <div className="flex flex-col">
        <label htmlFor="department-select" className="mb-1 font-medium text-gray-700">Department</label>
        <select
          id="department-select"
          value={form.department}
          onChange={(e) => handleChange("department", e.target.value)}
          disabled={isEditMode || isCreatorManager}
          className={`border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 ${isEditMode || isCreatorManager ? "bg-gray-200 cursor-not-allowed" : ""}`}
        >
          {/* Keep an empty option to preserve same visual when no value */}
          {!form.department && <option value="">Select Department</option>}
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Employee Type (select) - styled like input */}
      <div className="flex flex-col">
        <label htmlFor="employee-type-select" className="mb-1 font-medium text-gray-700">Employee Type</label>
        <select
          id="employee-type-select"
          value={form.employeeType}
          onChange={(e) => handleChange("employeeType", e.target.value)}
          disabled={isEditMode || isCreatorManager}
          className={`border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 ${isEditMode || isCreatorManager ? "bg-gray-200 cursor-not-allowed" : ""}`}
        >
          {EMPLOYEE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="flex flex-col">
        <label htmlFor="location" className="mb-1 font-medium text-gray-700">Location</label>
        <input
          id="location"
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={(e) => handleChange("location", e.target.value)}
          className={`border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.location ? "border-red-500" : ""}`}
        />
        {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
      </div>

      {/* Submit button */}
      <div className="md:col-span-2 mt-4">
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg text-lg font-medium ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Saving..." : isEditMode ? "Update Employee" : type === "admin" ? "Create Manager / Employee" : "Create Employee"}
        </button>
      </div>
    </form>
  );
}
