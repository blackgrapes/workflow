"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Briefcase,
  CalendarDays,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

interface ManagerDashboardData {
  totalEmployees: number;
  totalLeads: number;
  leadsLast7Days: number;
  dailyLeads?: { date: string; count: number }[];
}

interface ManagerDashboardProps {
  managerId: string;
  department: string;
}

export default function ManagerDashboard({
  managerId,
  department,
}: ManagerDashboardProps) {
  const [data, setData] = useState<ManagerDashboardData>({
    totalEmployees: 0,
    totalLeads: 0,
    leadsLast7Days: 0,
    dailyLeads: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ managerId, department }),
        });

        if (!res.ok) throw new Error("Failed to fetch dashboard data");

        const result: ManagerDashboardData = await res.json();
        setData(result);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [managerId, department]);

  const chartData = useMemo(() => {
    return (
      data.dailyLeads?.map((d) => ({
        name: d.date,
        Leads: d.count,
      })) || []
    );
  }, [data.dailyLeads]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Manager Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        <StatCard
          title="Total Employees"
          value={data.totalEmployees}
          icon={<Users className="w-6 h-6 text-white" />}
          gradient="from-blue-500 to-blue-400"
        />
        <StatCard
          title="Total Leads"
          value={data.totalLeads}
          icon={<Briefcase className="w-6 h-6 text-white" />}
          gradient="from-purple-500 to-purple-400"
        />
        <StatCard
          title="Last 7 Days Leads"
          value={data.leadsLast7Days}
          icon={<CalendarDays className="w-6 h-6 text-white" />}
          gradient="from-teal-500 to-teal-400"
        />
      </div>

      {/* Charts */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Leads Trend (Last 7 Days)
            </h2>
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    borderColor: "#14b8a6",
                    fontSize: "0.875rem",
                  }}
                />
                <Bar
                  dataKey="Leads"
                  fill="#14b8a6"
                  radius={[6, 6, 0, 0]}
                  barSize={26}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-10">No chart data</p>
          )}
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Leads Performance Overview
            </h2>
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    borderColor: "#0d9488",
                    fontSize: "0.875rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Leads"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#0d9488" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-10">No chart data</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------
   Gradient Stat Card Component
--------------------------------*/
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string; // Tailwind gradient string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient }) => {
  return (
    <div className="relative bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-bold mt-1 text-gray-800">{value}</p>
        </div>
        <div
          className={`p-4 rounded-full text-white bg-gradient-to-tr ${gradient} shadow-md`}
        >
          {icon}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent"></div>
    </div>
  );
};
