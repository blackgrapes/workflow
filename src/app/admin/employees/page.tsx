"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EmployeeTable from "../component/employeeManage/EmployeeTable";
import { useSession } from "@/lib/frontendApis/login/session";
import LoadingSkeleton from "@/app/component/loading/loading";
import { EmployeeData } from "@/types/user";
import {
  fetchAllEmployees,
  fetchEmployeesByManager,
  deleteEmployee,
} from "@/lib/frontendApis/admin/apiFunctions";

export default function EmployeeManagementPage() {
  const { session, loading: sessionLoading } = useSession();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch employees based on role
  const loadEmployees = async () => {
    if (!session) return;
    setLoading(true);
    try {
      let data: EmployeeData[] = [];
      if (session.role === "admin") {
        data = await fetchAllEmployees();
      } else if (session.role === "manager") {
        data = await fetchEmployeesByManager(session.employeeId);
      }
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [session]);

  // Navigate to edit page
  const handleEdit = (empId: string) => {
    router.push(`/admin/employees/edit/${empId}`);
  };

  const handleDelete = async (empId: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      await deleteEmployee(empId);
      // Refetch the list after deletion
      await loadEmployees();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the employee.";
      console.error("Delete employee error:", error);
      alert(errorMessage);
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!session || (session.role !== "admin" && session.role !== "manager")) {
    return (
      <div className="text-center mt-20 text-red-600 font-semibold">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Employee Management
        </h1>
        <p className="text-gray-500 mt-1">
          View and manage your team members efficiently.
        </p>
      </div>

      {/* Employee Table */}
      <EmployeeTable
        employees={employees}
        onEdit={handleEdit} // Navigate to edit page
        onDelete={handleDelete}
      />
    </div>
  );
}
