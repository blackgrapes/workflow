"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Lead } from "@/types/leads";

interface EmployeeAllLeadsProps {
  employeeMongoId?: string;
  employeeCode?: string;
  department: string;
  leads: Lead[];
}

export default function EmployeeAllLeads({
  employeeMongoId = "",
  employeeCode = "",
  department,
  leads,
}: EmployeeAllLeadsProps) {
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [search, setSearch] = useState("");
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

  const normalizeDeptKey = (dept?: string) =>
    (dept ?? "").toLowerCase().replace(/\s+/g, "");

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

      const searchTerm = (search || "").trim().toLowerCase();
      const customerName = String(lead.customerService?.customerName ?? "").toLowerCase();
      const matchesSearch = searchTerm === "" ? true : customerName.includes(searchTerm);

      return assigned && matchesSearch;
    });

    setFilteredLeads(filtered);
  },[leads, employeeMongoId, employeeCode, department, search]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // ---------- ONLY CHANGE: navigate to /leads/[id] when View clicked ----------
  const onViewLead = (leadMongoId: string) => {
    // leadMongoId should be the Mongo _id (string)
    if (!leadMongoId) return;
    router.push(`/leads/${encodeURIComponent(leadMongoId)}`);
  };
  // ---------------------------------------------------------------------------

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-bold text-teal-700 mb-4">
        {department ? `${department} - All Leads` : "All Leads"}
      </h1>
      <p className="text-gray-600 mb-6">
        Employee ID | {employeeCode || "-"}
      </p>

      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <input
          type="text"
          placeholder="Search by customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-6">
        {filteredLeads.length === 0 && (
          <div className="text-center text-gray-500 col-span-full">No leads found.</div>
        )}

        {filteredLeads.map((lead) => {
          const idStr = idToString(lead._id);
          const isExpanded = expandedRows.includes(idStr);

          return (
            <div key={idStr} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleRow(idStr)}>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Lead ID: {lead.leadId}</p>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {lead.customerService?.customerName ?? "-"}
                  </h2>
                  <p className="text-gray-600">
                    {lead.customerService?.contactNumber ?? "-"} | {lead.customerService?.city ?? "-"}, {lead.customerService?.state ?? "-"}
                  </p>
                </div>
                <div className="text-teal-600">
                  {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-gray-200 pt-4 space-y-4">
                  {lead.customerService?.products?.length ? (
                    lead.customerService.products.map((prod, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700">{prod.productName}</span>
                        <span className="text-gray-600">Qty: {prod.quantity}</span>
                        <span className="text-gray-600">Size: {prod.size ?? "-"}</span>
                        <span className="text-gray-600">Price: {prod.targetPrice ?? "-"}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No products available</div>
                  )}

                  <button
                    onClick={() => onViewLead(idStr)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition"
                  >
                    <Eye size={16} /> View Lead
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
