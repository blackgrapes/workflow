// src/app/(your-path)/component/EmployeeDashboard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Users, PlusCircle, Share, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface EmployeeDashboardProps {
  employeeId?: string;
  department?: string;
}

interface Lead {
  currentStatus: string;
  logs?: { employeeId?: string; timestamp?: string; comment?: string }[];
  createdAt: string;
  updatedAt?: string;
}

type DayPoint = { day: string; count: number; key: string };

function toKolkataDateKey(d: string | Date): string {
  // produce YYYY-MM-DD for Asia/Kolkata
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // en-CA -> YYYY-MM-DD
}

function last7DaysKeys(): string[] {
  // produce 7 keys: oldest -> newest
  const res: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const ms = Date.now() - i * 24 * 60 * 60 * 1000;
    res.push(toKolkataDateKey(new Date(ms)));
  }
  return res;
}

/** heuristics to decide if a lead was forwarded to shipping */
function isForwardedToShipping(lead: Lead): boolean {
  if (!lead.logs || lead.logs.length === 0) return false;

  // If currentStatus already not sourcing and there is a shipping-related log -> forwarded
  const currentNotSourcing = lead.currentStatus && lead.currentStatus.toLowerCase() !== "sourcing";

  const shippingMention = lead.logs.some((l) => {
    const c = (l.comment ?? "").toLowerCase();
    if (!c) return false;
    if (c.includes("shipping") || c.includes("(shipping)")) return true;
    if (c.includes("forwarded to") && c.includes("shipping")) return true;
    // employee codes like "SH-EMP-1063"
    if (/\bsh-emp\b/i.test(c) || /sh-emp-/i.test(c)) return true;
    return false;
  });

  // If a shipping mention exists in logs, consider forwarded.
  if (shippingMention) return true;

  // Otherwise if current status moved off sourcing and there are logs that mention forwarded, consider forwarded.
  const forwardedMention = lead.logs.some((l) => /forwarded to/i.test(l.comment ?? ""));
  if (currentNotSourcing && forwardedMention) return true;

  return false;
}

/** Small sparkline component (mini bars) — keeps the original color feel */
function MiniSparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" className="inline-block">
      {points.map((p, i) => {
        const w = 8;
        const gap = 2;
        const x = i * (w + gap);
        const h = Math.round((p / max) * 18);
        const y = 22 - h;
        return <rect key={i} x={x} y={y} rx={2} width={w} height={h} fill="#4fd1c5" />;
      })}
    </svg>
  );
}

export default function EmployeeDashboard({ employeeId, department }: EmployeeDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Fetch leads from your endpoint
  useEffect(() => {
    let mounted = true;
    async function fetchLeads() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (employeeId) params.set("employeeId", employeeId);
        if (department) params.set("department", department);

        const url =
          `/api/dashboard/employee${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const payload = await res.json();
        if (!payload.success) throw new Error("Failed to load leads");
        if (!mounted) return;
        setLeads(payload.data ?? []);
      } catch (err) {
        if (!mounted) return;
        setError((err as Error).message ?? "Unknown error");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    fetchLeads();
    return () => {
      mounted = false;
    };
  }, [employeeId, department]);

  // compute summary
  const summary = useMemo(() => {
    const keys = last7DaysKeys(); // oldest -> newest
    const dayMap: Record<string, number> = {};
    keys.forEach((k) => (dayMap[k] = 0));

    let totalLeads = 0;
    let newLeads = 0;
    let updatedLeads = 0;
    let forwardedLeads = 0;
    let todayCount = 0;

    const todayKey = toKolkataDateKey(new Date());

    leads.forEach((ld) => {
      totalLeads++;
      const logsCount = (ld.logs?.length ?? 0);
      const key = toKolkataDateKey(ld.createdAt);
      if (key in dayMap) dayMap[key]++;

      // today's count
      if (key === todayKey) todayCount++;

      // new / updated / forwarded logic
      const isSourcing = (ld.currentStatus ?? "").toLowerCase() === "sourcing";
      const hasLogs = logsCount > 0;
      const forwardedShipping = isForwardedToShipping(ld);

      if (isSourcing && !hasLogs) newLeads++;
      else if (isSourcing && hasLogs) updatedLeads++;
      else if (!isSourcing && forwardedShipping) forwardedLeads++;
      else if (!isSourcing && hasLogs && !forwardedShipping) {
        // if moved but no shipping mention, still treat as forwarded (safe fallback)
        forwardedLeads++;
      }
    });

    const dailyLeads: DayPoint[] = keys.map((k) => ({
      key: k,
      day: new Date(k).toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Kolkata" }),
      count: dayMap[k] ?? 0,
    }));

    return {
      totalLeads,
      newLeads,
      updatedLeads,
      forwardedLeads,
      dailyLeads,
      todayCount,
    };
  }, [leads]);

  // small loading / error handling
  if (loading) return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  // build cards (keep your colors)
  const cards = [
    { name: "Total Leads", value: summary.totalLeads, icon: Users },
    { name: "New Leads", value: summary.newLeads, icon: PlusCircle },
    { name: "Updated Leads", value: summary.updatedLeads, icon: PlusCircle },
    { name: "Forwarded Leads", value: summary.forwardedLeads, icon: Share },
  ];

  const dailyCounts = summary.dailyLeads.map((d) => ({ day: d.day, count: d.count }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="rounded-2xl bg-white shadow-lg p-6 md:p-8 mb-6 border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">
              {employeeId ? "Employee Dashboard" : "Team Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {employeeId ? `Employee: ${employeeId}` : "Overview of all employees"}
              {department ? ` • Department: ${department}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500 hidden md:block">Last updated:</div>
            <div className="bg-slate-100 px-3 py-2 rounded-lg text-sm text-slate-700">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {cards.map((c) => {
            const Icon = c.icon;
            const percent =
              c.name === "Total Leads"
                ? 100
                : summary.totalLeads > 0
                ? Math.round((c.value / summary.totalLeads) * 100)
                : 0;

            // sparkline points from daily counts — rotate to most recent 7
            const sparkPoints = summary.dailyLeads.map((d) => d.count);

            return (
              <div
                key={c.name}
                className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm text-slate-500">{c.name}</h3>
                    <div className="mt-2 flex items-baseline gap-3">
                      <div className="text-3xl md:text-4xl font-bold text-slate-900">
                        {c.value}
                      </div>
                      <div className="text-xs text-slate-500 hidden md:block">Leads</div>
                    </div>

                    <div className="mt-3">
                      <MiniSparkline points={sparkPoints} />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <Icon size={22} className="text-slate-600" />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percent}%`,
                        background: "linear-gradient(90deg,#4fd1c5,#3182ce)",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <div>{percent}% of total</div>
                    <div>{c.name === "Total Leads" ? "All leads" : `${c.value} leads`}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* small row: today's leads + quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Today</div>
              <div className="text-2xl font-bold text-slate-900">{summary.todayCount}</div>
              <div className="text-xs text-slate-500 mt-1">leads created today (Asia/Kolkata)</div>
            </div>
            <div className="text-slate-400">
              <BarChart2 size={36} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <div className="text-sm text-slate-500">New / Updated</div>
            <div className="mt-2 flex items-center gap-6">
              <div>
                <div className="text-lg font-semibold">{summary.newLeads}</div>
                <div className="text-xs text-slate-500">New (no logs)</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{summary.updatedLeads}</div>
                <div className="text-xs text-slate-500">Updated (sourcing + logs)</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <div className="text-sm text-slate-500">Forwarded</div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">{summary.forwardedLeads}</div>
              <div className="text-xs text-slate-500 mt-1">Moved off sourcing (likely to shipping)</div>
            </div>
          </div>
        </div>

        {/* Last 7 days chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Leads in last 7 days</h3>
            <div className="text-slate-500 text-sm">Timezone: Asia/Kolkata</div>
          </div>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCounts} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="grad" x1="0" x2="1">
                    <stop offset="0%" stopColor="#4fd1c5" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3182ce" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#334155" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#334155" }} />
                <Tooltip />
                <Bar dataKey="count" fill="url(#grad)" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
