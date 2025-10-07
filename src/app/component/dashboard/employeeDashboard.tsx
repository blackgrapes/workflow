"use client";

import { UserPlus, PlusCircle, Share } from "lucide-react";

interface EmployeeDashboardProps {
  employeeId: string;
  department: string;
}

export default function EmployeeDashboard({ employeeId, department }: EmployeeDashboardProps) {
  // Dummy stats data; future me yahan API se real data fetch kar sakte ho
  const stats = [
    { name: "Total Leads", value: 120, icon: UserPlus },
    { name: "New Leads", value: 45, icon: PlusCircle },
    { name: "Forwarded Leads", value: 30, icon: Share },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10 bg-gray-50 min-h-screen">
      {/* Heading */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-teal-700 mb-1">
          Employee Dashboard
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          Employee ID: <span className="font-medium">{employeeId}</span> | Department: <span className="font-medium">{department}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white border rounded-lg p-5 shadow-sm flex flex-col hover:shadow-md transition duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">{stat.name}</h3>
                <Icon size={20} className="text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 flex-1">Leads</p>
              <a
                href="#"
                className="text-blue-600 text-sm mt-2 hover:underline"
              >
                View Details
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
