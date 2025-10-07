"use client";

import { useState } from "react";
import {
  UserPlus,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ManagerDashboardProps {
  managerId: string;
  department: string;
}

// Dummy stats
const getStatsData = () => [
  { name: "Total Leads", value: 320, icon: UserPlus, color: "bg-teal-500" },
  { name: "Total Employees", value: 25, icon: Users, color: "bg-indigo-500" },
  { name: "Active Employees", value: 20, icon: CheckCircle, color: "bg-green-500" },
  { name: "Pending Leads", value: 15, icon: Clock, color: "bg-orange-500" },
];

// Dummy daily leads data
const dailyLeadsData = [
  { day: "Mon", leads: 20 },
  { day: "Tue", leads: 35 },
  { day: "Wed", leads: 25 },
  { day: "Thu", leads: 40 },
  { day: "Fri", leads: 30 },
  { day: "Sat", leads: 50 },
  { day: "Sun", leads: 45 },
];

export default function ManagerDashboard({ managerId, department }: ManagerDashboardProps) {
  const [stats] = useState(getStatsData());

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gray-50 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-teal-700 mb-1">
          {department} Manager Dashboard
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          Manager ID: <span className="font-medium">{managerId}</span> | Department: <span className="font-medium">{department}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`flex flex-col justify-between bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition duration-300`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">{stat.name}</h3>
                <div className={`${stat.color} rounded-full p-2`}>
                  <Icon size={22} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.name}</p>
              <a href="#" className="mt-2 text-blue-600 text-sm hover:underline">View Details</a>
            </div>
          );
        })}
      </div>

      {/* Daily Leads Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Daily Leads Overview</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={dailyLeadsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#4B5563" />
            <YAxis stroke="#4B5563" />
            <Tooltip
              contentStyle={{ backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              itemStyle={{ color: "#14B8A6" }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Line
              type="monotone"
              dataKey="leads"
              stroke="#14B8A6"
              strokeWidth={3}
              activeDot={{ r: 6 }}
              dot={{ r: 4, fill: "#14B8A6" }}
              fill="url(#lineGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
