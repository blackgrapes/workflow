"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp,  Search, Calendar,  User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Lead } from "@/types/leads";

interface EmployeeAllLeadsProps {
  employeeMongoId?: string;
  employeeCode?: string;
  department: string;
  leads: Lead[];
  isAdmin?: boolean;
}

export default function EmployeeAllLeads({
  employeeMongoId = "",
  employeeCode = "",
  department,
  leads,
  isAdmin = false,
}: EmployeeAllLeadsProps) {
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "customerName">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);

  const idToString = (id: unknown): string => {
    if (id === null || id === undefined) return "";
    try {
      if (typeof id === "object" && id && "toString" in id) {
        return (id as { toString(): string }).toString();
      }
      return String(id);
    } catch {
      return String(id);
    }
  };

  const normalizeDeptKey = (dept?: string) => (dept ?? "").toLowerCase().replace(/\s+/g, "");

  const matchesSession = (leadEmpId: unknown, leadEmpName: unknown): boolean => {
    const leadIdStr = idToString(leadEmpId);
    const leadNameStr = idToString(leadEmpName);
    const mongoStr = idToString(employeeMongoId);
    const codeStr = (employeeCode || "").trim();
    if (mongoStr && (leadIdStr === mongoStr || leadNameStr === mongoStr)) return true;
    if (codeStr && (leadIdStr === codeStr || leadNameStr === codeStr)) return true;
    return false;
  };

  useEffect(() => {
    const deptKey = normalizeDeptKey(department);
    const searchTerm = (search || "").trim().toLowerCase();

    // If admin, show all leads (only apply search filter)
    if (isAdmin) {
      const filtered = leads.filter((lead) => {
        const customerName = String(lead.customerService?.customerName ?? "").toLowerCase();
        const matchesSearch = searchTerm === "" ? true : customerName.includes(searchTerm);
        return matchesSearch;
      });

      setFilteredLeads(filtered);
      return;
    }

    const filtered = leads.filter((lead) => {
      const csEmpId = lead.customerService?.employeeId;
      const sourcingEmpId = lead.sourcing?.employeeId;
      const shippingEmpId = lead.shipping?.employeeId;
      const salesEmpId = lead.sales?.employeeId;
      const currentAssignedEmpId = lead.currentAssignedEmployee?.employeeId;
      const currentAssignedEmpName = lead.currentAssignedEmployee?.employeeName;

      let assigned = false;
      if (deptKey === "customerservice" || deptKey === "customerservices") {
        assigned =
          matchesSession(csEmpId, undefined) ||
          matchesSession(currentAssignedEmpId, currentAssignedEmpName);
      } else if (deptKey === "sourcing") {
        assigned =
          matchesSession(sourcingEmpId, undefined) ||
          matchesSession(currentAssignedEmpId, currentAssignedEmpName);
      } else if (deptKey === "shipping") {
        assigned =
          matchesSession(shippingEmpId, undefined) ||
          matchesSession(currentAssignedEmpId, currentAssignedEmpName);
      } else if (deptKey === "sales") {
        assigned =
          matchesSession(salesEmpId, undefined) ||
          matchesSession(currentAssignedEmpId, currentAssignedEmpName);
      } else {
        assigned =
          matchesSession(csEmpId, undefined) ||
          matchesSession(sourcingEmpId, undefined) ||
          matchesSession(shippingEmpId, undefined) ||
          matchesSession(salesEmpId, undefined) ||
          matchesSession(currentAssignedEmpId, currentAssignedEmpName);
      }

      const customerName = String(lead.customerService?.customerName ?? "").toLowerCase();
      const matchesSearch = searchTerm === "" ? true : customerName.includes(searchTerm);

      return assigned && matchesSearch;
    });

    setFilteredLeads(filtered);
  }, [leads, employeeMongoId, employeeCode, department, search, isAdmin]);

  const sortedLeads = useMemo(() => {
    const copy = [...filteredLeads];
    copy.sort((a, b) => {
      if (sortBy === "customerName") {
        const aName = String(a.customerService?.customerName ?? "").toLowerCase();
        const bName = String(b.customerService?.customerName ?? "").toLowerCase();
        if (aName < bName) return sortDir === "asc" ? -1 : 1;
        if (aName > bName) return sortDir === "asc" ? 1 : -1;
        return 0;
      } else {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortDir === "asc" ? aTime - bTime : bTime - aTime;
      }
    });
    return copy;
  }, [filteredLeads, sortBy, sortDir]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const onViewLead = (leadMongoId: string) => {
    if (!leadMongoId) return;
    router.push(`/leads/${encodeURIComponent(leadMongoId)}`);
  };

  const Badge = ({
    children,
    color = "bg-gray-100 text-gray-800",
  }: {
    children: React.ReactNode;
    color?: string;
  }) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color} max-w-[8rem] truncate`}
    >
      {children}
    </span>
  );

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-teal-700">
            {department ? `${department} - All Leads` : "All Leads"}
          </h1>
          <p className="text-gray-600 mt-1">Employee ID | {employeeCode || "-"}</p>
        </div>

        <div className="flex gap-3 items-center w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={16} />
            </div>
            <input
              aria-label="Search leads by customer name"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Sort by date"
              title="Sort by date"
              className="flex items-center gap-2 px-3 py-2 rounded border bg-white"
              onClick={() => {
                if (sortBy === "createdAt") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else setSortBy("createdAt");
              }}
            >
              <Calendar size={16} />
              <span className="text-sm hidden sm:inline">Date</span>
            </button>

            <button
              type="button"
              aria-label="Sort by customer"
              title="Sort by customer"
              className="flex items-center gap-2 px-3 py-2 rounded border bg-white"
              onClick={() => {
                if (sortBy === "customerName") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else setSortBy("customerName");
              }}
            >
              <User2 size={16} />
              <span className="text-sm hidden sm:inline">Customer</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* header row (desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm text-gray-600 border-b">
          <div className="col-span-2 font-medium">Lead ID</div>
          <div className="col-span-3 font-medium">Customer</div>
          <div className="col-span-2 font-medium">Contact</div>
          <div className="col-span-2 font-medium">Location</div>
          <div className="col-span-1 font-medium">Products</div>
          <div className="col-span-1 font-medium">Status</div>
          <div className="col-span-1 font-medium text-right">Action</div>
        </div>

        {sortedLeads.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No leads found.</div>
        ) : (
          <div className="divide-y">
            {sortedLeads.map((lead) => {
              const idStr = idToString(lead._id);
              const customerName = String(lead.customerService?.customerName ?? "-");
              const contact = String(lead.customerService?.contactNumber ?? "-");
              const location = `${lead.customerService?.city ?? "-"}, ${lead.customerService?.state ?? "-"}`;
              const products = lead.customerService?.products ?? [];
              const isExpanded = expandedRows.includes(idStr);

              return (
                <div key={idStr} className="px-4 md:px-6 py-4">
                  {/* single responsive row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-2 text-sm text-gray-600">#{lead.leadId}</div>
                    <div className="md:col-span-3 font-medium text-gray-800">{customerName}</div>
                    <div className="md:col-span-2 text-gray-700">{contact}</div>
                    <div className="md:col-span-2 text-gray-700">{location}</div>
                    <div className="md:col-span-1 flex justify-start md:justify-center">
                      <Badge color="bg-rose-50 text-rose-700">{products.length}</Badge>
                    </div>
                    <div className="md:col-span-1 flex justify-start md:justify-center">
                      <Badge color="bg-teal-50 text-teal-700">{String(lead.currentStatus ?? "-")}</Badge>
                    </div>
                    <div className="md:col-span-1 flex justify-start md:justify-end items-center ">
                      <button
                        type="button"
                        aria-label={isExpanded ? "Collapse lead details" : "Expand lead details"}
                        title={isExpanded ? "Collapse" : "Expand"}
                        className="p-2 rounded border hover:bg-gray-50"
                        onClick={() => toggleRow(idStr)}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* expanded content (single block under the row) */}
                  {isExpanded && (
                    <div className="mt-3 border rounded-lg bg-gray-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Products</h4>
                          {products.length ? (
                            <div className="space-y-2">
                              {products.map((prod, i) => (
                                <div key={i} className="flex justify-between items-center bg-white p-3 rounded border">
                                  <div className="font-medium text-gray-700">{prod.productName ?? "-"}</div>
                                  <div className="text-sm text-gray-600">Qty: {String(prod.quantity ?? "-")}</div>
                                  <div className="text-sm text-gray-600">Size: {prod.size ?? "-"}</div>
                                  <div className="text-sm text-gray-600">Price: {String(prod.targetPrice ?? "-")}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No products available</div>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2">Lead details</h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            <div><strong>Assigned to:</strong> {lead.currentAssignedEmployee?.employeeName ?? "-"}</div>
                            <div><strong>Status:</strong> {lead.currentStatus ?? "-"}</div>
                            <div><strong>Contact:</strong> {lead.customerService?.contactNumber ?? "-"}</div>
                            <div><strong>Address:</strong> {lead.customerService?.address ?? "-"}</div>
                            <div><strong>Created:</strong> {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "-"}</div>
                          </div>

                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => onViewLead(idStr)}
                              className="px-3 py-2 bg-teal-600 text-white rounded"
                            >
                              View Full Lead
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
