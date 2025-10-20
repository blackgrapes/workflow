"use client";

import React, { useEffect, useState } from "react";
import {  Briefcase } from "lucide-react";

interface Client {
  marka: string;
  totalLeads: number;
  leadIds: string[];
}

interface ApiResponse {
  clients: Client[];
}

interface Props {
  userId: string;
  role: string;
}

export default function ClientPage({ userId, role }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, role }),
        });
        if (!res.ok) throw new Error("Failed to fetch clients");
        const data: ApiResponse = await res.json();
        setClients(data.clients);
      } catch (err) {
        console.error("Client fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [userId, role]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">
          Loading Clients...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Clients</h1>

      {clients.length === 0 ? (
        <p className="text-center text-gray-500">No clients found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.marka}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {client.marka}
                </h2>
                <Briefcase className="w-6 h-6 text-teal-600" />
              </div>
              <p className="text-gray-600">
                Total Leads: <span className="font-medium">{client.totalLeads}</span>
              </p>
              <p className="text-gray-500 mt-2 text-sm">
                Lead IDs: {client.leadIds.join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
