"use client";

import { useRouter } from "next/navigation";
import EmployeeForm from "../../component/employeeManage/EmployeeForm";
import { createEmployee } from "../../../../lib/frontendApis/admin/apiFunctions";
import { useSession } from "@/lib/frontendApis/login/session";
import LoadingSkeleton from "@/app/component/loading/loading";

export default function AddEmployeePage() {
  const router = useRouter();
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!session || !session.role) {
    router.push("/");
    return null;
  }

  if (session.role !== "admin" && session.role !== "manager") {
    router.push("/");
    return null;
  }

  const formType = session.role === "admin" ? "admin" : "manager";
  const department = session.department || "";
  const managerId = session.role === "manager" ? session.employeeId : undefined;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Add New Employee</h1>
      <EmployeeForm
        onSubmit={createEmployee}
        type={formType}
        department={department}
        managerId={managerId} // Pass manager ID if role is manager
      />
    </div>
  );
}
