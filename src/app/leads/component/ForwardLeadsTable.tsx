"use client";

import React from "react";
import { useRouter } from "next/navigation";

export interface Product {
  productName?: string;
  quantity?: number;
  size?: string;
  usage?: string;
  targetPrice?: number;
}

export interface CustomerService {
  customerName?: string;
  contactNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  products?: Product[];
}

export interface Employee {
  employeeName?: string;
}

export interface Lead {
  _id?: string;
  leadId: string;
  customerService?: CustomerService;
  currentStatus?: string;
  currentAssignedEmployee?: Employee;
}

interface ForwardLeadsTableProps {
  leads: Lead[];
  filteredLeads: Lead[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedLeadIds: Set<string>;
  role?: string;
  department?: string;
  allowedActions?: boolean;

  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  handleDelete?: (lead: Lead) => void;
}

const ForwardLeadsTable: React.FC<ForwardLeadsTableProps> = ({
  leads,
  filteredLeads,
  searchTerm,
  setSearchTerm,
  selectedLeadIds,
  role,
  department,
  allowedActions = false,
  toggleSelect,
  toggleSelectAll,
  handleDelete,
}) => {
  const router = useRouter();

  const normalizedDept = department?.replace(/\s+/g, "").toLowerCase();
  const canDelete = role === "admin" || normalizedDept === "customerservice";

  return (
    <div className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Leads</h2>
          <p className="text-sm text-gray-500">
            Showing {filteredLeads.length} of {leads.length} lead
            {leads.length !== 1 ? "s" : ""}{" "}
            {role === "admin" ? "— (admin view)" : role ? `— (${role})` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="leadSearch" className="sr-only">
            Search leads
          </label>
          <input
            id="leadSearch"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Lead ID / Customer / Contact"
            aria-label="Search Lead ID, Customer, or Contact"
            title="Search Lead ID, Customer, or Contact"
            className="border rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No leads found.</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    aria-label="Select all leads"
                    title="Select all leads"
                    className="accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-2 text-left text-gray-600">Lead ID</th>
                <th className="px-4 py-2 text-left text-gray-600">Customer</th>
                <th className="px-4 py-2 text-left text-gray-600">Contact</th>
                <th className="px-4 py-2 text-left text-gray-600">Address</th>
                <th className="px-4 py-2 text-left text-gray-600">Products</th>
                <th className="px-4 py-2 text-left text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => {
                const id = String(lead._id ?? lead.leadId);
                const isSelected = selectedLeadIds.has(id);
                const customer = lead.customerService;
                const customerName = customer?.customerName ?? "—";
                const contactNumber = customer?.contactNumber ?? "—";
                const addressParts = [customer?.address, customer?.city, customer?.state].filter(Boolean);
                const address = addressParts.join(", ") || "—";
                const productsCount = customer?.products?.length ?? 0;

                return (
                  <tr
                    key={id}
                    className={`hover:bg-gray-50 transition cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}
                    onClick={() => toggleSelect(id)}
                  >
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        aria-label={`Select lead ${lead.leadId}`}
                        title={`Select lead ${lead.leadId}`}
                        className="accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2">{lead.leadId}</td>
                    <td className="px-4 py-2">{customerName}</td>
                    <td className="px-4 py-2">{contactNumber}</td>
                    <td className="px-4 py-2">{address}</td>
                    <td className="px-4 py-2">{productsCount}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/leads/view/${id}`);
                        }}
                        className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
                        title="View Lead"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/leads/edit/${id}`);
                        }}
                        className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
                        title="Edit Lead"
                      >
                        Edit
                      </button>
                      {canDelete && handleDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(lead);
                          }}
                          className="text-sm px-3 py-1 rounded-md border text-red-600 hover:bg-red-50"
                          title="Delete Lead"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ForwardLeadsTable;
