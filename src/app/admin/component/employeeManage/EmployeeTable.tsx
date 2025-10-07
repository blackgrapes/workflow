"use client";

import { useState, useMemo } from "react";
import { EmployeeData } from "@/types/user";

type Props = {
  employees: EmployeeData[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function EmployeeTable({ employees, onEdit, onDelete }: Props) {
  // Filter out Admins
  const filteredEmployees = useMemo(
    () => employees.filter(emp => emp.type !== "Admin"),
    [employees]
  );

  // Search state
  const [search, setSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter employees by search query
  const searchedEmployees = useMemo(() => {
    if (!search.trim()) return filteredEmployees;
    const query = search.toLowerCase();
    return filteredEmployees.filter(
      emp =>
        emp.name.toLowerCase().includes(query) ||
        emp.empId.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query)
    );
  }, [search, filteredEmployees]);

  // Pagination logic
  const totalPages = Math.ceil(searchedEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return searchedEmployees.slice(start, start + itemsPerPage);
  }, [currentPage, searchedEmployees]);

  return (
    <div className="bg-white p-4 rounded shadow">
      {/* Header with count and search */}
      <div className="flex justify-between items-center mb-4">
        <div>Total Employees: {filteredEmployees.length}</div>
        <input
          type="text"
          placeholder="Search by name, ID, or department"
          className="border px-2 py-1 rounded"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
        />
      </div>

      {/* Employee Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
            <tr>
              <th className="px-4 py-2">Employee ID</th>
              <th className="px-4 py-2">Profile</th>
              <th className="px-4 py-2">Full Name</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-2 text-center text-gray-500">
                  No employees found.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map(emp => (
                <tr key={emp.empId} className="border-t text-sm">
                  <td className="px-4 py-2">{emp.empId}</td>
                  <td className="px-4 py-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-600 text-white font-bold">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-4 py-2">{emp.name}</td>
                  <td className="px-4 py-2">{emp.department}</td>
                  <td className="px-4 py-2">{emp.role}</td>
                  <td className="px-4 py-2 text-gray-500">{emp.phone || "-"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        emp.status === "Active"
                          ? "bg-teal-100 text-teal-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {emp.status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => onEdit(emp.empId)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(emp.empId)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx + 1}
              onClick={() => setCurrentPage(idx + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === idx + 1 ? "bg-teal-600 text-white" : ""
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
