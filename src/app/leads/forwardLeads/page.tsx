"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "@/lib/frontendApis/login/session";
import LoadingSkeleton from "@/app/component/loading/loading";
import ForwardLeadsList from "../component/ForwardLeadsList";
import { Lead } from "@/types/leads";
import {
  getForwardEmployeeLeads,
  forwardLeads as forwardLeadsApi,
} from "@/lib/frontendApis/employees/apis";

type UserRole = "admin" | "manager" | "employee";

export default function ForwardLeadsPage() {
  const { session, loading } = useSession();
  const [backendLeads, setBackendLeads] = useState<Lead[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);

  const leads: Lead[] = useMemo(() => (Array.isArray(backendLeads) ? backendLeads : []), [backendLeads]);

  const fetchLeads = async () => {
    if (!session) {
      console.warn("Session not available yet, cannot fetch leads.");
      return;
    }

    setFetching(true);
    console.group("🔹 Fetching leads for session");
    console.log(session);

    try {
      const employeeMongoId = session.mongoId ?? "";
      const employeeCode = session.employeeId ?? "";
      const department = session.department ?? "";
      const role: UserRole = (session.role as UserRole) || "employee";

      console.log("📨 Sending params to API:", {
        employeeMongoId,
        department,
        employeeCode,
        role,
      });

      // Include role in the request
      const urlParams = new URLSearchParams({
        employeeId: employeeMongoId,
        employeeCode,
        department,
        role,
      });

      const res = await fetch(`/api/leads/get?${urlParams.toString()}`);
      const data = await res.json();
      console.log("📦 API Response:", data);

      if (data.success && Array.isArray(data.leads)) {
        setBackendLeads(data.leads);
        console.log("✅ Leads set to state:", data.leads.length);
      } else {
        console.warn("⚠️ No leads returned or invalid format");
        setBackendLeads([]);
      }
    } catch (err) {
      console.error("❌ Error fetching forward leads:", err);
      setBackendLeads([]);
    } finally {
      setFetching(false);
      console.groupEnd();
    }
  };

  useEffect(() => {
    if (!loading && session) {
      fetchLeads();
    }
  }, [loading, session]);

  const role: UserRole = (session?.role as UserRole) || "employee";
  const employeeMongoId: string = session?.mongoId ?? "";
  const employeeCode: string = session?.employeeId ?? "";
  const department: string = session?.department ?? "all";

  const handleForward = async (leadIds: string[], forwardTo: string) => {
    if (!leadIds.length || !forwardTo) {
      console.warn("Invalid forward parameters");
      return;
    }

    console.log("➡️ Forwarding leads:", leadIds, "to:", forwardTo);

    try {
      const data = await forwardLeadsApi(leadIds, forwardTo);

      if (data.success) {
        console.log("✅ Leads forwarded successfully!", data);
        alert("Leads forwarded successfully!");
        await fetchLeads(); // Refresh leads
      } else {
        console.error("❌ Failed to forward leads:", data.message);
        alert("Failed to forward leads: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("❌ Error forwarding leads:", err);
      alert("Error forwarding leads. Check console for details.");
    }
  };

  if (loading || fetching) {
    return (
      <div>
        <LoadingSkeleton />
        <p>Fetching leads...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Forward Leads</h1>
      <ForwardLeadsList
        role={role}
        employeeMongoId={employeeMongoId}
        employeeCode={employeeCode}
        department={department}
        leads={leads}
        onForward={handleForward}
      />
      <div className="mt-2 text-sm text-gray-600">
        <p>Total leads displayed: {leads.length}</p>
      </div>
    </div>
  );
}
