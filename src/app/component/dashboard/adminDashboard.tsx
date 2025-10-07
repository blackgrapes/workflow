"use client";

import {
  Shield,
  Package,
  Truck,
  CreditCard,
} from "lucide-react";

const departments = [
  { name: "Customer Service", employees: 1, icon: Shield },
  { name: "Sourcing", employees: 1, icon: Package },
  { name: "Shipping", employees: 1, icon: Truck },
  { name: "Sales", employees: 1, icon: CreditCard },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold">Admin Panel Dashboard</h1>
        <p className="text-gray-600">Employee Distribution by Department</p>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {departments.map((dept) => {
          const Icon = dept.icon;
          return (
            <div
              key={dept.name}
              className="bg-white border rounded-lg p-4 shadow-sm flex flex-col hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{dept.name}</h3>
                <Icon size={18} className="text-gray-600" />
              </div>
              <p className="text-2xl font-bold">{dept.employees}</p>
              <p className="text-sm text-gray-500 flex-1">Employees</p>
              <a href="#" className="text-blue-600 text-sm mt-2 hover:underline">
                View Details
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
