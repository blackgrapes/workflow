"use client";

import { useState } from "react";
import {
  MessageSquare,
  FileEdit,
  FileText,
  Activity,
} from "lucide-react"; // icons

// Type definitions
type LogEntry = {
  id: string;
  leadId: string;
  department: string;
  employee: string;
  logType: string;
  message: string;
  timestamp: string;
};

// Sample Leads
const leads = [
  { id: "L001", name: "Lead 1" },
  { id: "L002", name: "Lead 2" },
  { id: "L003", name: "Lead 3" },
];

// Sample Audit Logs
const sampleLogs: LogEntry[] = [
  {
    id: "1",
    leadId: "L001",
    department: "Sales",
    employee: "Ravi Sharma",
    logType: "Comment",
    message: "Contacted client and shared initial quotation.",
    timestamp: "2025-09-20T10:15:00",
  },
  {
    id: "2",
    leadId: "L001",
    department: "Sourcing",
    employee: "Priya Verma",
    logType: "Update",
    message: "Received supplier quotation and updated pricing.",
    timestamp: "2025-09-20T11:30:00",
  },
  {
    id: "3",
    leadId: "L001",
    department: "Shipping",
    employee: "Arjun Mehta",
    logType: "Comment",
    message: "Shipment dispatched, tracking number shared with client.",
    timestamp: "2025-09-21T09:45:00",
  },
  {
    id: "4",
    leadId: "L002",
    department: "Customer Service",
    employee: "Neha Jain",
    logType: "Note",
    message: "Followed up with client, waiting for confirmation.",
    timestamp: "2025-09-22T14:10:00",
  },
];

// 🔹 Utility function to pick icon by logType
const getLogIcon = (logType: string) => {
  switch (logType.toLowerCase()) {
    case "comment":
      return <MessageSquare className="w-5 h-5 text-blue-500" />;
    case "update":
      return <FileEdit className="w-5 h-5 text-green-500" />;
    case "note":
      return <FileText className="w-5 h-5 text-orange-500" />;
    default:
      return <Activity className="w-5 h-5 text-gray-500" />;
  }
};

export default function AuditLogPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchedLeadId, setSearchedLeadId] = useState("");

  const filteredLogs = sampleLogs
    .filter((log) => log.leadId === searchedLeadId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  const leadName = leads.find((l) => l.id === searchedLeadId)?.name || "";

  // Format date consistently
  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
  };

  const handleSearch = () => {
    const leadExists = leads.find(
      (l) => l.id.toLowerCase() === searchInput.toLowerCase()
    );
    if (leadExists) {
      setSearchedLeadId(leadExists.id);
    } else {
      setSearchedLeadId(""); // reset if not found
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Audit Log</h1>

      {/* Search Bar */}
      <div
        className={`mb-6 flex flex-col md:flex-row gap-4 items-center justify-center transition-all duration-500 ${
          searchedLeadId ? "mt-0" : "mt-32"
        }`}
      >
        <input
          type="text"
          placeholder="Search Lead ID (e.g., L001)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border rounded-lg px-4 py-3 w-full md:w-2/3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
        />
        <button
          onClick={handleSearch}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg shadow text-lg"
          disabled={!searchInput}
        >
          Search
        </button>
      </div>

      {/* Show Lead Details */}
      {searchedLeadId && (
        <p className="text-center text-gray-600 mb-6">
          Lead ID: <span className="font-medium">{searchedLeadId}</span> | Lead
          Name: <span className="font-medium">{leadName}</span>
        </p>
      )}

      {/* Timeline */}
      {searchedLeadId && (
        <div className="relative">
          {/* Vertical progress line on the right */}
          <div className="absolute right-6 top-0 w-1 bg-teal-300 h-full"></div>

          <div className="space-y-6">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-gray-500">No logs found.</p>
            ) : (
              filteredLogs.map((log, idx) => (
                <div key={log.id} className="flex relative justify-end">
                  {/* Log content */}
                  <div className="mr-10 bg-white rounded-lg shadow p-4 w-full max-w-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500 text-sm">
                        {formatDate(log.timestamp)}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        {getLogIcon(log.logType)}
                        {log.logType}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-1">{log.message}</p>
                    <p className="text-sm text-gray-500">
                      • update by {log.employee} | {log.department}
                    </p>
                  </div>

                  {/* Timeline dot */}
                  <div className="absolute right-0 top-4 flex flex-col items-center">
                    <div className="w-4 h-4 bg-teal-500 rounded-full z-10"></div>
                    {idx !== filteredLogs.length - 1 && (
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
