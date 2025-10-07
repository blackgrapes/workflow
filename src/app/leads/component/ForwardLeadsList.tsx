"use client";

import React, { useEffect, useMemo, useState } from "react";
import ForwardLeadsTable, { Lead as FrontLead } from "./ForwardLeadsTable";
import { Lead as BackendLead } from "@/types/leads";

type UserRole = "admin" | "manager" | "employee";

interface EmployeeOption {
  _id?: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
}

interface ForwardLeadsListProps {
  role: UserRole;
  employeeMongoId: string;
  employeeCode: string;
  department: string;
  leads: BackendLead[];
  employees?: EmployeeOption[]; // for admin dropdown
  onDelete?: (lead: FrontLead) => void;
  onForward?: (leadIds: string[], forwardTo: string) => void;
}

/**
 * Safe converter: accepts string | object-with-toString | undefined and returns string.
 * Avoids using mongoose ObjectId at runtime (which is a type in TS contexts).
 */
const toStringId = (id?: unknown): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (typeof (id as { toString?: unknown }).toString === "function") {
    try {
      return String((id as { toString: () => string }).toString());
    } catch {
      return "";
    }
  }
  return "";
};

const normalizeDept = (s?: string) =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const isActionAllowedForUser = (role: UserRole, dept: string) => {
  const d = normalizeDept(dept);
  return (
    role === "admin" ||
    role === "manager" ||
    d === "customerservice" ||
    d === "sourcing" ||
    d === "shipping"
  );
};

const ForwardLeadsList: React.FC<ForwardLeadsListProps> = ({
  role,
  department,
  leads: backendLeads,
  employees = [],
  onDelete,
  onForward,
}) => {
  // state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [managerIdInput, setManagerIdInput] = useState<string>("");
  const [forwardDept, setForwardDept] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const allowedActions = useMemo(
    () => isActionAllowedForUser(role, department),
    [role, department]
  );

  // Minimal expected backend shape used only for safe mapping
  interface BackendLeadShape {
    _id?: unknown;
    leadId?: string;
    customerService?: { customerName?: string; contactNumber?: string };
    currentStatus?: string;
    currentAssignedEmployee?: { employeeName?: string };
  }

  // Map backend -> front lead (no `any`)
  const leads: FrontLead[] = useMemo(() => {
    return backendLeads.map((lead) => {
      const l = lead as unknown as BackendLeadShape;
      const id = toStringId(l._id);
      const leadId = l.leadId ?? id ?? "";

      const front: FrontLead = {
        _id: id,
        leadId,
        customerService: l.customerService ? { ...l.customerService } : undefined,
        currentStatus: l.currentStatus,
        currentAssignedEmployee: l.currentAssignedEmployee
          ? { ...l.currentAssignedEmployee }
          : undefined,
      };
      return front;
    });
  }, [backendLeads]);

  // filteredLeads (we're not rendering a search input per your ask)
  const filteredLeads = useMemo(() => leads, [leads]);

  const toggleSelect = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (filteredLeads.length === 0) {
      setSelectedLeadIds(new Set());
      return;
    }
    const ids = filteredLeads
      .map((l) => l._id ?? "")
      .map(String)
      .filter((s) => s.length > 0);
    if (selectedLeadIds.size === ids.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(ids));
    }
  };

  const handleDelete = (lead: FrontLead) => {
    if (onDelete) {
      onDelete(lead);
      return;
    }
    if (confirm(`Delete lead ${lead.leadId}? This action cannot be undone.`)) {
      console.log("Deleted", lead._id);
    }
  };

  // Employee forward options per rules; fallback to sensible defaults
  const forwardOptionsForEmployee = useMemo(() => {
    const d = normalizeDept(department);
    if (d === "customerservice") return ["sourcing", "shipping"];
    if (d === "sourcing") return ["shipping"];
    if (d === "shipping") return ["sales"];
    // fallback so select isn't empty
    return ["sourcing", "shipping", "sales"];
  }, [department]);

  // Admin employees list + "all"
  const adminEmployeeOptions = useMemo(() => {
    const opts = employees
      .map((e) => {
        const id = e._id ?? e.employeeId ?? "";
        const label = e.employeeName ?? e.employeeId ?? e._id ?? "Unknown";
        return { id, label };
      })
      .filter((o) => !!o.id);
    return [{ id: "all", label: "All employees" }, ...opts];
  }, [employees]);

  // defaults when options appear
  useEffect(() => {
    if (role === "employee" && forwardOptionsForEmployee.length > 0 && !forwardDept) {
      setForwardDept(forwardOptionsForEmployee[0]);
    }
  }, [role, forwardOptionsForEmployee, forwardDept]);

  useEffect(() => {
    if (role === "admin" && adminEmployeeOptions.length > 0 && !selectedEmployee) {
      setSelectedEmployee(adminEmployeeOptions[0].id);
    }
  }, [role, adminEmployeeOptions, selectedEmployee]);

  const handleForwardClick = () => {
    const selectedIds = Array.from(selectedLeadIds).filter((id) => id.length > 0);
    if (!selectedIds.length) {
      alert("Select at least one lead.");
      return;
    }

    if (role === "employee") {
      if (!managerIdInput.trim()) {
        alert("Enter manager ID.");
        return;
      }
      if (!forwardDept) {
        alert("Select a department to forward to.");
        return;
      }
      const target = `manager:${managerIdInput.trim()}|dept:${forwardDept}`;
      onForward?.(selectedIds, target);
    } else if (role === "admin") {
      if (!selectedEmployee) {
        alert("Select an employee (or All).");
        return;
      }
      const target = selectedEmployee === "all" ? "all" : `employee:${selectedEmployee}`;
      onForward?.(selectedIds, target);
    } else if (role === "manager") {
      if (!managerIdInput.trim()) {
        alert("Enter employee ID to forward to.");
        return;
      }
      const target = `employee:${managerIdInput.trim()}`;
      onForward?.(selectedIds, target);
    } else {
      alert("You don't have permission to forward leads.");
      return;
    }

    // reset
    setSelectedLeadIds(new Set());
    setManagerIdInput("");
    setForwardDept("");
    setSelectedEmployee("");
  };

  return (
    <div>
      {/* Controls area */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Employee UI */}
        {role === "employee" && (
          <>
            <input
              type="text"
              placeholder="Enter manager ID"
              className="border rounded-md px-3 py-2"
              value={managerIdInput}
              onChange={(e) => setManagerIdInput(e.target.value)}
              aria-label="Manager ID"
            />

            <select
              value={forwardDept}
              onChange={(e) => setForwardDept(e.target.value)}
              className="border rounded-md px-3 py-2"
              aria-label="Select department to forward to"
            >
              {forwardOptionsForEmployee.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>

            <button
              onClick={handleForwardClick}
              className="bg-blue-600 text-white px-3 py-2 rounded-md"
            >
              Forward Selected Leads
            </button>
          </>
        )}

        {/* Admin UI */}
        {role === "admin" && (
          <>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border rounded-md px-3 py-2"
              aria-label="Select employee to forward to"
            >
              {adminEmployeeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleForwardClick}
              className="bg-blue-600 text-white px-3 py-2 rounded-md"
            >
              Forward Selected Leads
            </button>
          </>
        )}

        {/* Manager UI */}
        {role === "manager" && (
          <>
            <input
              type="text"
              placeholder="Enter employee ID to forward to"
              className="border rounded-md px-3 py-2"
              value={managerIdInput}
              onChange={(e) => setManagerIdInput(e.target.value)}
              aria-label="Employee ID"
            />

            <button
              onClick={handleForwardClick}
              className="bg-blue-600 text-white px-3 py-2 rounded-md"
            >
              Forward Selected Leads
            </button>
          </>
        )}
      </div>

      {/* Leads table */}
      <ForwardLeadsTable
        leads={leads}
        filteredLeads={filteredLeads}
        searchTerm={""}
        setSearchTerm={() => {}}
        selectedLeadIds={selectedLeadIds}
        role={role}
        department={department}
        allowedActions={allowedActions}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default ForwardLeadsList;
