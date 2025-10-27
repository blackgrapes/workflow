"use client";

import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/frontendApis/login/session";
import { Briefcase, Phone, MapPin } from "lucide-react";

interface Client {
  marka: string;
  customerName?: string;
  contactNumber?: string;
  city?: string;
  state?: string;
  totalLeads: number;
}

interface ApiResponse {
  clients: Client[];
}

export default function ClientTablePage(): ReactNode {
  const { session, loading: sessionLoading } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters (only city and state kept)
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  useEffect(() => {
    if (!session) return;

    const fetchClients = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.mongoId ?? "",
            role: session.role ?? "employee",
          }),
        });

        if (!res.ok) throw new Error("Failed to fetch clients");

        const data: ApiResponse = await res.json();
        setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch (err: unknown) {
        if (err instanceof Error) console.error("Client fetch error:", err.message);
        else console.error("Client fetch error:", err);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [session]);

  // Derived unique lists for filter dropdowns (city & state)
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => set.add(c.city ?? "Unknown"));
    return ["all", ...Array.from(set).sort()];
  }, [clients]);

  const uniqueStates = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => set.add(c.state ?? "Unknown"));
    return ["all", ...Array.from(set).sort()];
  }, [clients]);

  // Filtered clients (only apply city and state filters)
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (cityFilter !== "all" && (c.city ?? "Unknown") !== cityFilter) return false;
      if (stateFilter !== "all" && (c.state ?? "Unknown") !== stateFilter) return false;
      return true;
    });
  }, [clients, cityFilter, stateFilter]);

  const clearFilters = () => {
    setCityFilter("all");
    setStateFilter("all");
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">Loading clients...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-red-500 text-lg font-semibold">Please log in to view clients</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <div className="text-sm text-gray-500 mt-1">
            Showing <strong>{filteredClients.length}</strong> of <strong>{clients.length}</strong> client{clients.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          {/* City filter */}
          <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 shadow-sm">
            <label className="text-xs text-gray-500 mr-2">City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-sm px-2 py-1 border rounded"
            >
              {uniqueCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* State filter */}
          <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 shadow-sm">
            <label className="text-xs text-gray-500 mr-2">State</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="text-sm px-2 py-1 border rounded"
            >
              {uniqueStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="text-sm px-3 py-2 border rounded bg-white hover:bg-gray-50"
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marka</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Leads</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No clients found.
                </td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => {
                const displayName = client.customerName ?? "Unknown";
                const displayCity = client.city ?? "Unknown";
                const displayState = client.state ?? "Unknown";
                return (
                  <tr key={`${client.marka}-${displayName}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-teal-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.marka}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{displayName}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{client.contactNumber || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{displayCity}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{displayState}</span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">{client.totalLeads}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right text-sm text-gray-500">Updated: {new Date().toLocaleString()}</div>
    </div>
  );
}
