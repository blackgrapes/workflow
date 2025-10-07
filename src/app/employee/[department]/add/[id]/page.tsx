  "use client";

  import React from "react";
  import { useParams } from "next/navigation";
  import Sourcing from "@/app/employee/component/add-details/Sourcing";
  import Sales from "@/app/employee/component/add-details/sales";

  export default function DepartmentPage() {
    const params = useParams<{ department: string; id: string }>();
    const { department, id } = params;

    // Component mapping
    const departmentComponents: Record<string, React.ComponentType<{ id: string }>> = {
      sourcing: Sourcing,
      sales: Sales,
    };

    const Component = departmentComponents[department];

    if (!Component) {
      return (
        <div className="p-6 text-red-500">
          Invalid department: <b>{department}</b>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">
          Department: {department} | Lead ID: {id}
        </h1>
        {/* Render correct component with lead id */}
        <Component id={id} />
      </div>
    );
  }
