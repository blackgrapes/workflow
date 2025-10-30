"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Briefcase, Smartphone, MapPin, Key, Plus } from "lucide-react";
import {
  generateEmployeeId,
  generatePassword,
} from "../../../../lib/frontendFunctions/admin/UtilsFunction";
import { EmployeeData as GlobalEmployeeData, Role } from "@/types/user";
import { validateEmployeeForm } from "../../../../lib/frontendFunctions/admin/employeeValidation";

// allow Manager or Employee (exclude Admin)
export type EmployeeType = Exclude<Role, "Admin">;

interface EmployeeFormProps {
  onSubmit?: (employeeData: GlobalEmployeeData) => void | Promise<void>;
  type: "admin" | "manager";
  department?: string;
  managerId?: string;
  defaultValues?: GlobalEmployeeData;
}

interface FormState {
  name: string;
  role: string;
  phone: string;
  location: string;
  department: "Sales" | "Shipping" | "Customer Service" | "Sourcing";
  employeeType: EmployeeType | "";
  managerIdPart1: string;
  managerIdPart2: string;
  managerIdPart3: string;
}

interface ErrorsState {
  name: string;
  role: string;
  phone: string;
  location: string;
  managerIdMismatch: string;
}

/** department code detection:
 * sa -> Sales
 * so -> Sourcing
 * sh -> Shipping
 * cs -> Customer Service
 * sl -> Sourcing
 */
function detectDepartmentFromPrefix(prefix: string): string | null {
  const p = prefix.toLowerCase();
  if (p === "sa") return "Sales";
  if (p === "so") return "Sourcing";
  if (p === "sh") return "Shipping";
  if (p === "cs") return "Customer Service";
  if (p === "sl") return "Sourcing";
  return null;
}

export default function EmployeeForm({
  onSubmit,
  type,
  department,
  managerId,
  defaultValues,
}: EmployeeFormProps) {
  const isEditMode = Boolean(defaultValues);
  const isCreatorManager = type === "manager";

  const [form, setForm] = useState<FormState>({
    name: defaultValues?.name || "",
    role: defaultValues?.role || "",
    phone: defaultValues?.phone || "",
    location: defaultValues?.location || "",
    department: (defaultValues?.department as FormState["department"]) || (department as FormState["department"]) || "Sales",
    employeeType: (defaultValues?.type as EmployeeType) || (isCreatorManager ? "Employee" : "Employee"),
    managerIdPart1: "",
    managerIdPart2: "",
    managerIdPart3: "",
  });

  const [errors, setErrors] = useState<ErrorsState>({
    name: "",
    role: "",
    phone: "",
    location: "",
    managerIdMismatch: "",
  });

  const [detectedManagerDepartment, setDetectedManagerDepartment] = useState<string | null>(null);

  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [passwords, setPasswords] = useState<{ newPassword: string; confirmPassword: string }>({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<{ newPassword: string; confirmPassword: string }>({
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name" || field === "role" || field === "phone" || field === "location") {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "managerIdPart1" || field === "managerIdPart2" || field === "managerIdPart3") {
      const newParts: FormState = { ...form, [field]: value } as FormState;
      const part1Trim = newParts.managerIdPart1.trim();
      const prefix = part1Trim.slice(0, 2);
      const detected = detectDepartmentFromPrefix(prefix);
      setDetectedManagerDepartment(detected);

      if (detected && newParts.department && newParts.department !== detected) {
        setErrors((prev) => ({ ...prev, managerIdMismatch: `Detected manager dept: ${detected}. Selected department mismatch.` }));
      } else {
        setErrors((prev) => ({ ...prev, managerIdMismatch: "" }));
      }
    }
  };

  const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validatePasswords = (): boolean => {
    const errs = { newPassword: "", confirmPassword: "" };
    let ok = true;
    const np = passwords.newPassword.trim();
    const cp = passwords.confirmPassword.trim();

    if (np.length < 6) {
      errs.newPassword = "Password should be at least 6 characters";
      ok = false;
    }
    if (np !== cp) {
      errs.confirmPassword = "Passwords do not match";
      ok = false;
    }

    setPasswordErrors(errs);
    return ok;
  };

  const getCombinedManagerId = (): string => {
    const p1 = form.managerIdPart1.trim();
    const p2 = form.managerIdPart2.trim();
    const p3 = form.managerIdPart3.trim();
    if (!p1 && !p2 && !p3) return "";
    const parts: string[] = [];
    if (p1) parts.push(p1.toUpperCase());
    if (p2) parts.push(p2.toUpperCase());
    if (p3) parts.push(p3.toUpperCase());
    return parts.join("-");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const combinedManagerId = getCombinedManagerId();
    if (!isCreatorManager && combinedManagerId) {
      const prefix = form.managerIdPart1.trim().slice(0, 2);
      const detected = detectDepartmentFromPrefix(prefix);
      if (detected && detected !== form.department) {
        setErrors((prev) => ({ ...prev, managerIdMismatch: `Detected manager dept: ${detected}. Select matching dept or fix manager ID.` }));
        return;
      }
    }

    const { valid, errors: validationErrors } = validateEmployeeForm({
      name: form.name,
      role: form.role,
      phone: form.phone,
      location: form.location,
    });

    setErrors((prev) => ({
      ...prev,
      name: validationErrors.name,
      role: validationErrors.role,
      phone: validationErrors.phone,
      location: validationErrors.location,
    }));

    if (!valid) return;

    if (isEditMode && changePassword) {
      if (!validatePasswords()) return;
    }

    setLoading(true);

    try {
      const finalDepartment = defaultValues?.department || (isCreatorManager ? (department || form.department) : form.department);
      const finalType = defaultValues?.type ? (defaultValues.type as EmployeeType) : (isCreatorManager ? ("Employee" as EmployeeType) : (form.employeeType as EmployeeType));
      const finalPassword = isEditMode ? (changePassword ? passwords.newPassword : defaultValues?.password || generatePassword()) : generatePassword();

      const createdByManagerId =
        defaultValues?.createdByManagerId ||
        (isCreatorManager ? managerId || "admin" : (combinedManagerId || "admin"));

      const employeeData: GlobalEmployeeData = {
        empId: defaultValues?.empId || generateEmployeeId(finalDepartment, finalType),
        password: finalPassword,
        status: defaultValues?.status || "Active",
        name: form.name,
        role: form.role,
        phone: form.phone,
        department: finalDepartment,
        type: finalType,
        location: form.location,
        createdByManagerId,
      };

      if (onSubmit) {
        await onSubmit(employeeData);
      }

      alert(
        `✅ ${defaultValues ? "Updated" : "Created"}!\nID: ${employeeData.empId}\nPassword: ${isEditMode ? (changePassword ? employeeData.password : "[unchanged]") : employeeData.password}\nDept: ${employeeData.department}`
      );

      router.push("/admin/employees");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("❌ Error saving employee!");
    } finally {
      setLoading(false);
    }
  };

  const showManagerIdInput = (): boolean => {
    return !isEditMode && !isCreatorManager && form.employeeType === "Employee";
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8 grid gap-6">
      {/* header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-teal-50 rounded-xl">
          <User className="w-7 h-7 text-teal-600" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold">Employee</h3>
          <p className="text-sm text-gray-500 mt-1">Add or update employee details</p>
        </div>
      </div>

      {/* name + role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
          <label className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4">
            <User className="w-5 h-5 text-gray-500" />
            <input
              id="name"
              className={`w-full bg-transparent outline-none text-base ${errors.name ? "text-red-600" : "text-gray-800"}`}
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </label>
          {errors.name && <p className="text-sm text-red-600 mt-2">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">Role / Designation</label>
          <label className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4">
            <Briefcase className="w-5 h-5 text-gray-500" />
            <input
              id="role"
              className={`w-full bg-transparent outline-none text-base ${errors.role ? "text-red-600" : "text-gray-800"}`}
              placeholder="Sales Executive"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              required
            />
          </label>
          {errors.role && <p className="text-sm text-red-600 mt-2">{errors.role}</p>}
        </div>
      </div>

      {/* phone + location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <label className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4">
            <Smartphone className="w-5 h-5 text-gray-500" />
            <input
              id="phone"
              className={`w-full bg-transparent outline-none text-base ${errors.phone ? "text-red-600" : "text-gray-800"}`}
              placeholder="99999 99999"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              required
            />
          </label>
          {errors.phone && <p className="text-sm text-red-600 mt-2">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <label className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4">
            <MapPin className="w-5 h-5 text-gray-500" />
            <input
              id="location"
              className={`w-full bg-transparent outline-none text-base ${errors.location ? "text-red-600" : "text-gray-800"}`}
              placeholder="City / Branch"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </label>
          {errors.location && <p className="text-sm text-red-600 mt-2">{errors.location}</p>}
        </div>
      </div>

      {/* department + type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select
            id="department"
            value={form.department}
            onChange={(e) => handleChange("department", e.target.value as FormState["department"])}
            disabled={isEditMode || isCreatorManager}
            className="w-full rounded-2xl border border-gray-200 px-5 py-3 bg-white text-base"
          >
            <option value="Sales">Sales</option>
            <option value="Shipping">Shipping</option>
            <option value="Customer Service">Customer Service</option>
            <option value="Sourcing">Sourcing</option>
          </select>
          {errors.managerIdMismatch ? (
            <p className="text-sm text-red-600 mt-3">{errors.managerIdMismatch}</p>
          ) : detectedManagerDepartment ? (
            <p className="text-sm text-gray-500 mt-3">Detected manager dept: {detectedManagerDepartment}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="employeeType" className="block text-sm font-medium text-gray-700 mb-2">Employee Type</label>
          <select
            id="employeeType"
            value={form.employeeType}
            onChange={(e) => handleChange("employeeType", e.target.value as EmployeeType)}
            disabled={isEditMode || isCreatorManager}
            className="w-full rounded-2xl border border-gray-200 px-5 py-3 bg-white text-base"
          >
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
      </div>

      {/* Manager ID input (compact) - only when admin creating an Employee */}
      {showManagerIdInput() && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Manager ID (optional)</label>
          <div className="flex flex-wrap items-center gap-4">
            <input
              aria-label="Manager ID prefix"
              maxLength={2}
              value={form.managerIdPart1}
              onChange={(e) => handleChange("managerIdPart1", e.target.value.toUpperCase())}
              placeholder="SA"
              className="w-24 rounded-2xl border border-gray-200 px-4 py-3 text-center text-base"
            />
            <div className="text-gray-400 text-lg">-</div>
            <input
              aria-label="Manager ID mid"
              maxLength={3}
              value={form.managerIdPart2}
              onChange={(e) => handleChange("managerIdPart2", e.target.value.toUpperCase())}
              placeholder="MGR"
              className="w-28 rounded-2xl border border-gray-200 px-4 py-3 text-center text-base"
            />
            <div className="text-gray-400 text-lg">-</div>
            <input
              aria-label="Manager ID suffix"
              maxLength={8}
              value={form.managerIdPart3}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                handleChange("managerIdPart3", v);
              }}
              placeholder="38330"
              className="w-40 rounded-2xl border border-gray-200 px-4 py-3 text-center text-base"
            />
            <div className="ml-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-sm">{getCombinedManagerId() || "not set"}</div>
          </div>
        </div>
      )}

      {/* password area (edit only) */}
      {isEditMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New password</label>
            <label className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4">
              <Key className="w-5 h-5 text-gray-500" />
              <input
                id="newPassword"
                type="password"
                className={`w-full bg-transparent outline-none text-base ${passwordErrors.newPassword ? "text-red-600" : "text-gray-800"}`}
                placeholder="New password"
                value={passwords.newPassword}
                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                disabled={!changePassword}
              />
            </label>
            {passwordErrors.newPassword && <p className="text-sm text-red-600 mt-2">{passwordErrors.newPassword}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
            <label className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4">
              <Key className="w-5 h-5 text-gray-500" />
              <input
                id="confirmPassword"
                type="password"
                className={`w-full bg-transparent outline-none text-base ${passwordErrors.confirmPassword ? "text-red-600" : "text-gray-800"}`}
                placeholder="Confirm password"
                value={passwords.confirmPassword}
                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                disabled={!changePassword}
              />
            </label>
            {passwordErrors.confirmPassword && <p className="text-sm text-red-600 mt-2">{passwordErrors.confirmPassword}</p>}
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <input id="togglePw" type="checkbox" checked={changePassword} onChange={(e) => setChangePassword(e.target.checked)} />
            <label htmlFor="togglePw" className="text-sm">Enable password update</label>
          </div>
        </div>
      )}

      {/* submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex items-center gap-3 rounded-full px-6 py-3 text-white font-medium ${loading ? "bg-teal-300 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"}`}
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <Plus className="w-5 h-5" />
          )}
          <span className="text-base">{isEditMode ? "Update" : "Create"}</span>
        </button>
      </div>
    </form>
  );
}
