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

  // Memoized leads array (always defined)
  const leads: Lead[] = useMemo(() => (Array.isArray(backendLeads) ? backendLeads : []), [backendLeads]);

  /**
   * Fetch leads assigned to the current user/employee
   * Can search by MongoId (employeeId) or employeeCode
   */
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

      if (!employeeMongoId && !employeeCode) {
        console.warn("❌ Both Employee Mongo ID and Employee Code are missing in session");
        setBackendLeads([]);
        return;
      }

      // Call API with both employeeId and employeeCode
      const data = await getForwardEmployeeLeads(employeeMongoId, department, employeeCode);
      console.log("📦 API Response:", data);

      // Unwrap leads array from API response
      if (data.success && Array.isArray(data.leads)) {
        setBackendLeads(data.leads);
        console.log("✅ Leads set to state:", data.leads.length);
      } else {
        console.warn("⚠️ No leads returned from API or invalid format");
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

  // Fetch leads once session is ready
  useEffect(() => {
    if (!loading && session) {
      fetchLeads();
    }
  }, [loading, session]);

  const role: UserRole = (session?.role as UserRole) || "employee";
  const employeeMongoId: string = session?.mongoId ?? "";
  const employeeCode: string = session?.employeeId ?? "";
  const department: string = session?.department ?? "all";

  /**
   * Forward selected leads to another employee/manager
   */
  const handleForward = async (leadIds: string[], forwardTo: string) => {
    if (!leadIds.length) {
      console.warn("No leads selected to forward.");
      return;
    }
    if (!forwardTo) {
      console.warn("Forward target not specified.");
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
    } catch (err: unknown) {
      console.error("❌ Error forwarding leads:", err);
      alert("Error forwarding leads. Check console for details.");
    }
  };

  // Render loading state first
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
