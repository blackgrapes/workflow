"use client";

import { useEffect, useState } from "react";
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
  const [forwardLeads, setForwardLeads] = useState<Lead[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);

  /**
   * Fetch leads assigned to the current user/employee
   */
  const fetchLeads = async () => {
    if (!session) {
      console.warn("Session not available yet, cannot fetch leads.");
      return;
    }

    setFetching(true);
    console.log("🔹 Fetching leads for session:", session);

    try {
      const employeeMongoId = session.mongoId ?? "";
      const department = session.department ?? "";

      if (!employeeMongoId) {
        console.warn("❌ Employee Mongo ID missing in session");
        setForwardLeads([]);
        return;
      }

      const leads = await getForwardEmployeeLeads(employeeMongoId, department);

      console.log("📦 Leads fetched from API:", leads);
      setForwardLeads(leads || []);
    } catch (err) {
      console.error("❌ Error fetching forward leads:", err);
      setForwardLeads([]);
    } finally {
      setFetching(false);
    }
  };

  // Fetch leads once session is ready
  useEffect(() => {
    if (!loading && session) {
      fetchLeads();
    }
  }, [loading, session]);

  if (loading || fetching) {
    return (
      <div>
        <LoadingSkeleton />
        <p>Fetching leads...</p>
      </div>
    );
  }

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
        // Refresh leads after forwarding
        await fetchLeads();
      } else {
        console.error("❌ Failed to forward leads:", data.message);
        alert("Failed to forward leads: " + (data.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("❌ Error forwarding leads:", err);
      alert("Error forwarding leads. Check console for details.");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Forward Leads</h1>
      <ForwardLeadsList
        role={role}
        employeeMongoId={employeeMongoId}
        employeeCode={employeeCode}
        department={department}
        leads={forwardLeads}
        onForward={handleForward}
      />
      <div className="mt-2">
        <p>Total leads displayed: {forwardLeads.length}</p>
      </div>
    </div>
  );
}
