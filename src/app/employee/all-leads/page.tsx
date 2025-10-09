  // app/employee/all-leads/page.tsx
  "use client";

  import { useEffect, useState } from "react";
  import EmployeeAllLeads from "../component/all-leads/employeeAllLeads";
  import { useSession } from "@/lib/frontendApis/login/session";
  import { getEmployeeLeads } from "@/lib/frontendApis/employees/apis";
  import LoadingSkeleton from "@/app/component/loading/loading";
  import { Lead } from "@/types/leads";

  export default function AllLeadsDataPage() {
    const { session, loading } = useSession();
    const [employeeLeads, setEmployeeLeads] = useState<Lead[]>([]);

    useEffect(() => {
      const fetchLeads = async () => {
        if (!loading && session) {
          const mongoId = session.mongoId ?? ""; // prefer mongoId
          const fallback = session.employeeId ?? ""; // legacy code

          try {
            const leads = await getEmployeeLeads(mongoId || fallback);
            console.log("Leads fetched in page:", leads?.length ?? 0);
            setEmployeeLeads(leads || []);
          } catch (err) {
            console.error("Error fetching leads:", err);
            setEmployeeLeads([]);
          }
        }
      };
      fetchLeads();
    }, [loading, session]);

    if (loading) return <LoadingSkeleton />;

    const employeeMongoId = session?.mongoId ?? "";
    const employeeCode = session?.employeeId ?? "";
    const department = session?.department ?? "all";

    return (
      <EmployeeAllLeads
        employeeMongoId={employeeMongoId}
        employeeCode={employeeCode}
        department={department}
        leads={employeeLeads}
      />
    );
  }
