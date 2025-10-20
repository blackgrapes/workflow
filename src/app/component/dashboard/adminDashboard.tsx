// src/app/(your-path)/component/AdminDashboard.tsx
"use client";

import React, { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Shield,
  Package,
  Truck,
  CreditCard,
  Users,
  BarChart2,
  CalendarDays,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

/**
 * Types
 */
type EmployeeItem = {
  _id: string;
  department: string;
  phone?: string;
  createdAt?: string;
};

type DepartmentGroup = {
  department: string;
  count: number;
  employees: EmployeeItem[];
};

type LeadShort = {
  _id: string;
  leadId: string;
  currentStatus: string;
  currentAssignedEmployee?: { employeeId?: string; employeeName?: string };
  createdAt?: string;
};

type LeadsGroup = {
  department: string;
  count: number;
  leads: LeadShort[];
};

type DashboardTotals = {
  totalLeads: number;
  totalEmployees: number;
  leadsLast7Days: number;
};

type ChartData = {
  name: string;
  value: number;
  color: string;
};

/**
 * Icon map and palette
 */
const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  "Customer Service": Shield,
  Sourcing: Package,
  Shipping: Truck,
  Sales: CreditCard,
};

const SOFT_COLORS = [
  "rgba(20,184,166,0.95)",
  "rgba(59,130,246,0.95)",
  "rgba(168,85,247,0.95)",
  "rgba(236,72,153,0.95)",
  "rgba(249,115,22,0.95)",
];

/**
 * Helpers
 */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function normalizeDeptKey(name: string | undefined): string {
  return (name ?? "unknown").toString().trim().toLowerCase();
}

function isDepartmentGroupArray(v: unknown): v is DepartmentGroup[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (d) =>
      isObject(d) &&
      typeof (d as Record<string, unknown>).department === "string" &&
      typeof (d as Record<string, unknown>).count === "number"
  );
}

function isLeadsGroupArray(v: unknown): v is LeadsGroup[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (l) =>
      isObject(l) &&
      typeof (l as Record<string, unknown>).department === "string" &&
      typeof (l as Record<string, unknown>).count === "number"
  );
}

/**
 * Component
 */
export default function AdminDashboard(): ReactNode{
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [employeesByDepartment, setEmployeesByDepartment] = useState<
    DepartmentGroup[]
  >([]);
  const [leadsByDepartmentLast7Days, setLeadsByDepartmentLast7Days] =
    useState<LeadsGroup[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchDashboard() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/dashboard/admin", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        const jsonRaw: unknown = await res.json();
        if (!isObject(jsonRaw)) throw new Error("Invalid response shape");

        const successFlag = (jsonRaw as Record<string, unknown>).success;
        const dataPart = (jsonRaw as Record<string, unknown>).data;
        if (successFlag !== true || !isObject(dataPart)) {
          throw new Error("Unexpected API response");
        }

        // totals
        const totalsCandidate = dataPart.totals;
        if (
          isObject(totalsCandidate) &&
          typeof (totalsCandidate as Record<string, unknown>).totalLeads ===
            "number" &&
          typeof (totalsCandidate as Record<string, unknown>).totalEmployees ===
            "number" &&
          typeof (totalsCandidate as Record<string, unknown>).leadsLast7Days ===
            "number"
        ) {
          if (mounted) {
            setTotals(totalsCandidate as DashboardTotals);
          }
        } else {
          throw new Error("Invalid totals shape from API");
        }

        // employeesByDepartment
        const employeesCandidate = (dataPart as Record<string, unknown>)
          .employeesByDepartment;
        if (isDepartmentGroupArray(employeesCandidate)) {
          if (mounted) setEmployeesByDepartment(employeesCandidate);
        } else {
          // fallback: transform possible structure into one group
          if (Array.isArray(employeesCandidate)) {
            const fallback: DepartmentGroup[] = [
              {
                department: "Unknown",
                count: employeesCandidate.length,
                employees: employeesCandidate as EmployeeItem[],
              },
            ];
            if (mounted) setEmployeesByDepartment(fallback);
          } else {
            throw new Error("Invalid employeesByDepartment shape from API");
          }
        }

        // leads by department last 7 days - prefer explicit key, else fallback to leadsByDepartment
        const leadsLast7 =
          (dataPart as Record<string, unknown>).leadsByDepartmentLast7Days;
        const leadsAll = (dataPart as Record<string, unknown>).leadsByDepartment;

        if (isLeadsGroupArray(leadsLast7)) {
          if (mounted) setLeadsByDepartmentLast7Days(leadsLast7);
        } else if (isLeadsGroupArray(leadsAll)) {
          if (mounted) setLeadsByDepartmentLast7Days(leadsAll);
        } else {
          if (mounted) setLeadsByDepartmentLast7Days([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Build normalized lookup map for leads (helps match 'sourcing' vs 'Sourcing')
   */
  const leadsLast7Map = useMemo(() => {
    const map = new Map<string, LeadsGroup>();
    for (const g of leadsByDepartmentLast7Days) {
      map.set(normalizeDeptKey(g.department), g);
    }
    return map;
  }, [leadsByDepartmentLast7Days]);

  const employeesChartData: ChartData[] = useMemo(
    () =>
      employeesByDepartment.map((d, idx) => ({
        name: d.department,
        value: d.count,
        color: SOFT_COLORS[idx % SOFT_COLORS.length],
      })),
    [employeesByDepartment]
  );

  const leadsLast7DaysChartData: ChartData[] = useMemo(
    () =>
      // Use normalized keys so departments with different casing still show
      Array.from(leadsLast7Map.values()).map((g, idx) => ({
        name: g.department,
        value: g.count,
        color: SOFT_COLORS[idx % SOFT_COLORS.length],
      })),
    [leadsLast7Map]
  );

  return (
    <div className="p-6">
      {/* top area - header + quick stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-slate-800">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Clean overview — employees and leads by department
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <Users size={16} />
            <div className="text-sm">
              <div className="text-xs text-slate-400">Employees</div>
              <div className="font-medium text-sm">
                {loading ? "—" : totals?.totalEmployees ?? 0}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <CalendarDays size={16} />
            <div className="text-sm">
              <div className="text-xs text-slate-400">Leads (7d)</div>
              <div className="font-medium text-sm">
                {loading ? "—" : totals?.leadsLast7Days ?? 0}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <BarChart2 size={16} />
            <div className="text-sm">
              <div className="text-xs text-slate-400">Total Leads</div>
              <div className="font-medium text-sm">
                {loading ? "—" : totals?.totalLeads ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left: department cards + overview */}
        <div className="lg:col-span-2 space-y-4">
          {/* department cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employeesByDepartment.map((dept, idx) => {
              const Icon = ICONS[dept.department] ?? Shield;
              const color = SOFT_COLORS[idx % SOFT_COLORS.length];
              const leadsForDept =
                leadsLast7Map.get(normalizeDeptKey(dept.department))?.count ??
                0;

              return (
                <div
                  key={dept.department + "-" + idx}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          background: `${color}20`,
                        }}
                      >
                        <Icon size={22} />
                      </div>

                      <div>
                        <div className="text-sm font-medium text-slate-700">
                          {dept.department}
                        </div>
                        <div className="mt-1 flex items-baseline gap-4">
                          <div className="text-2xl font-semibold text-slate-800">
                            {dept.count}
                          </div>
                          <div className="text-sm text-slate-500">Employees</div>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          New:{" "}
                          {dept.employees.length > 0
                            ? new Date(
                                dept.employees[0].createdAt ?? ""
                              ).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-500">Leads (7d)</div>
                      <div className="text-2xl font-semibold text-slate-800">
                        {leadsForDept}
                      </div>
                      <a
                        href="#"
                        className="mt-3 inline-block text-sm text-sky-500 hover:underline"
                      >
                        View details
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* departments overview 'paper' look */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-700">
                  Departments overview
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Snapshot per department — employees and recent leads
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-500">Filter</div>
                <button className="px-3 py-1 text-xs border border-slate-200 rounded-md text-slate-600">
                  Last 7 days
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employeesByDepartment.map((d, i) => (
                <div
                  key={`overview-${d.department}-${i}`}
                  className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-3"
                >
                  <div>
                    <div className="text-xs text-slate-500">{d.department}</div>
                    <div className="font-medium text-slate-700">
                      {d.count} employees
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Leads (7d)</div>
                    <div className="font-semibold text-slate-800">
                      {leadsLast7Map.get(normalizeDeptKey(d.department))?.count ??
                        0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right: charts panel */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm h-72">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700">
                Employees by Department
              </h4>
              <div className="text-xs text-slate-400">Realtime</div>
            </div>

            <div className="h-48">
              {employeesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeesChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#475569" }}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: "#475569" }} />
                    <Tooltip
                      wrapperStyle={{
                        background: "#ffffff",
                        borderRadius: 8,
                        boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
                      }}
                      itemStyle={{ color: "#0f172a" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                      {employeesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  No data
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm h-72">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700">
                Leads in last 7 days
              </h4>
              <div className="text-xs text-slate-400">By Department</div>
            </div>

            <div className="h-48 flex items-center justify-center">
              {leadsLast7DaysChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsLast7DaysChartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={60}
                      innerRadius={28}
                      paddingAngle={6}
                    >
                      {leadsLast7DaysChartData.map((entry, idx) => (
                        <Cell key={`pie-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={24} />
                    <Tooltip
                      wrapperStyle={{
                        background: "#ffffff",
                        borderRadius: 8,
                        boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400">No recent leads</div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* status messages */}
      <div className="mt-6">
        {error ? (
          <div className="text-sm text-rose-600">Error: {error}</div>
        ) : null}
        {loading ? (
          <div className="text-sm text-slate-500">Loading dashboard...</div>
        ) : null}
      </div>
    </div>
  );
}
