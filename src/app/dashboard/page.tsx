"use client";

import { useSession } from "@/lib/frontendApis/login/session";
import AdminDashboard from "../component/dashboard/adminDashboard";
import EmployeeDashboard from "../component/dashboard/employeeDashboard";
import ManagerDashboard from "../component/dashboard/ManagerDashboard";
import LoadingSkeleton from "../component/loading/loading";


export default function DashboardPage() {
  const { session, loading } = useSession();

  const renderContent = () => {
    if (!session) return null;

    switch (session.role) {
      case "admin":
        return <AdminDashboard />;
      case "employee":
        return (
          <EmployeeDashboard
            employeeId={session.employeeId}
            department={session.department!}
          />
        );
      case "manager":
        return (
          <ManagerDashboard
            managerId={session.employeeId}
            department={session.department!}
          />
        );
      default:
        console.error("❌ Invalid role or missing department:", session.role);
        return <div>Invalid role or department</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
       <LoadingSkeleton/>
      </div>
    );
  }

  return <>{renderContent()}</>;
}
