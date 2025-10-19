"use client";

import React, { useEffect, useState } from "react";
import { fetchEmployeesByManager } from "@/lib/frontendApis/admin/apiFunctions";
import type { EmployeeData } from "@/types/user";

interface EmployeeSelectProps {
  managerId: string;
  onSelect: (employee: EmployeeData | null) => void;
  label?: string;
}

const EmployeeSelect: React.FC<EmployeeSelectProps> = ({
  managerId,
  onSelect,
  label = "Select Employee",
}) => {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const selectId = `employee-select-${managerId}`;

  useEffect(() => {
    if (!managerId) {
      setEmployees([]);
      return;
    }

    const loadEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchEmployeesByManager(managerId);
        if (Array.isArray(data)) {
          setEmployees(data);
        } else {
          console.warn("Unexpected employee data:", data);
          setEmployees([]);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees");
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [managerId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = employees.find((emp) => emp.empId === e.target.value) || null;
    setSelectedId(e.target.value);
    onSelect(selected);
  };

  return (
    <div className="w-full max-w-md">
      
      {loading ? (
        <div className="animate-pulse bg-gray-100 rounded-lg h-10 w-full" />
      ) : error ? (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      ) : employees.length === 0 ? (
        <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
          No employees found for this manager.
        </div>
      ) : (
        <div className="relative">
          <select
            id={selectId}
            value={selectedId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            title={label}
          >
            <option value="">-- Select an Employee --</option>
            {employees.map((emp) => (
              <option key={emp.empId} value={emp.empId}>
                {emp.name}
                {emp.department ? ` (${emp.department})` : ""}
              </option>
            ))}
          </select>

          {/* Custom dropdown icon */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 12a1 1 0 01-.707-.293l-4-4a1 1 0 111.414-1.414L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0110 12z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSelect;
