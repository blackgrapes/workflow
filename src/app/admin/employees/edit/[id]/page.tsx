"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchEmployee,
  updateEmployee,
} from "@/lib/frontendApis/admin/apiFunctions";
import LoadingSkeleton from "@/app/component/loading/loading";
import { EmployeeData } from "@/types/user";
import EmployeeForm from "@/app/admin/component/employeeManage/EmployeeForm";

export default function EditEmployeePage() {
  const params = useParams(); // object containing route params
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Ensure id is always a string
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!id) return; // guard against undefined

    const loadEmployee = async () => {
      setLoading(true);
      try {
        const data = await fetchEmployee(id); // now id is guaranteed to be string
        setEmployee(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [id]);

  const handleUpdate = async (updatedEmployee: EmployeeData) => {
    try {
      await updateEmployee(updatedEmployee);
      alert("✅ Employee updated successfully");
      router.push("/admin/employees");
    } catch (err: unknown) {
      // Type guard to safely access message
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update employee";
      console.error(err);
      alert(errorMessage);
    }
  };

  if (loading || !employee) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Edit Employee</h1>
      <EmployeeForm
        onSubmit={handleUpdate}
        type="admin" // or detect from employee.type if needed
        department={employee.department}
        managerId={employee.createdByManagerId}
        defaultValues={employee} // pass current data
      />
    </div>
  );
}
