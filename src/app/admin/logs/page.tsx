"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  FileEdit,
  FileText,
} from "lucide-react";

// Type definitions
interface EmployeeRef {
  employeeId: string;
  employeeName: string;
}

interface Log {
  employeeId: string;
  employeeName: string;
  timestamp: string;
  comment: string;
}

interface LeadDetails {
  _id: string;
  leadId: string;
  currentStatus: string;
  currentAssignedEmployee?: EmployeeRef;
  customerService?: {
    customerName: string;
    contactNumber: string;
    address: string;
    city: string;
    state: string;
    marka: string;
  };
  logs: Log[];
}

export default function AuditLogPage() {
  const [searchInput, setSearchInput] = useState("");
  const [leadData, setLeadData] = useState<LeadDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Icon based on log type (comment/update/note)
  const getLogIcon = (logComment: string) => {
    if (logComment.toLowerCase().includes("update")) {
      return <FileEdit className="w-5 h-5 text-green-500" />;
    } else if (logComment.toLowerCase().includes("note")) {
      return <FileText className="w-5 h-5 text-orange-500" />;
    } else {
      return <MessageSquare className="w-5 h-5 text-blue-500" />;
    }
  };

  // Format date nicely
  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
  };

  const handleSearch = async () => {
    if (!searchInput) return;
    setLoading(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchInput, // Lead ID or Marka
          userId: "YOUR_USER_ID_HERE",
          role: "YOUR_ROLE_HERE",
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch lead logs");
      const result: LeadDetails = await res.json();
      setLeadData(result);
    } catch (err) {
      console.error(err);
      setLeadData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Audit Log</h1>

      {/* Search Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-center">
        <input
          type="text"
          placeholder="Search Lead ID or Marka"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border rounded-lg px-4 py-3 w-full md:w-2/3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
        />
        <button
          onClick={handleSearch}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg shadow text-lg"
          disabled={!searchInput || loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Lead Info */}
      {leadData && (
        <div className="mb-6 text-center text-gray-700">
          <p>
            <span className="font-medium">Lead ID:</span> {leadData.leadId} |{" "}
            <span className="font-medium">Status:</span> {leadData.currentStatus} |{" "}
            <span className="font-medium">Marka:</span>{" "}
            {leadData.customerService?.marka || "-"}
          </p>
          <p>
            <span className="font-medium">Customer:</span>{" "}
            {leadData.customerService?.customerName || "-"} |{" "}
            <span className="font-medium">Contact:</span>{" "}
            {leadData.customerService?.contactNumber || "-"}
          </p>
        </div>
      )}

      {/* Timeline */}
      {leadData && (
        <div className="relative">
          <div className="absolute right-6 top-0 w-1 bg-teal-300 h-full"></div>
          <div className="space-y-6">
            {leadData.logs.length === 0 ? (
              <p className="text-center text-gray-500">No logs found.</p>
            ) : (
              leadData.logs
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
                )
                .map((log, idx) => (
                  <div key={log.employeeId + idx} className="flex relative justify-end">
                    <div className="mr-10 bg-white rounded-lg shadow p-4 w-full max-w-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 text-sm">
                          {formatDate(log.timestamp)}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          {getLogIcon(log.comment)}
                          Log
                        </span>
                      </div>
                      <p className="text-gray-700 mb-1">{log.comment}</p>
                      <p className="text-sm text-gray-500">
                        • by {log.employeeName}
                      </p>
                    </div>

                    {/* Timeline Dot */}
                    <div className="absolute right-0 top-4 flex flex-col items-center">
                      <div className="w-4 h-4 bg-teal-500 rounded-full z-10"></div>
                      {idx !== leadData.logs.length - 1 && (
                        <div className="flex-1 w-1 bg-teal-500"></div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
