"use client";

import React, { ReactNode, useEffect, useState } from "react";
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Briefcase className="w-5 h-5" />
          <span>{clients.length} client{clients.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Leads</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No clients found.
                </td>
              </tr>
            ) : (
              clients.map((client, idx) => (
                <tr key={`${client.marka}-${idx}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-teal-600" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.marka}</div>
                        <div className="text-xs text-gray-500">{client.customerName || "Unknown"}</div>
                      </div>
                    </div>
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
                      <span className="text-sm text-gray-700">{client.city || "Unknown"}{client.state ? `, ${client.state}` : ""}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">{client.totalLeads}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right text-sm text-gray-500">Updated: {new Date().toLocaleString()}</div>
    </div>
  );
}
