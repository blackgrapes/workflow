// src/app/leads/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lead } from "@/types/leads";
import { getLeadById } from "@/lib/frontendApis/employees/apis";
import LoadingSkeleton from "@/app/component/loading/loading";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid lead id.");
      setLoading(false);
      return;
    }

    const fetchLead = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the frontend API function instead of raw fetch
        const data = await getLeadById(id);
        if (!data) {
          setError("Lead not found");
          setLead(null);
        } else {
          setLead(data);
        }
   } catch (err: unknown) {
  console.error("Error fetching lead:", err);

  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError(String(err)); // fallback for non-Error values
  }

  setLead(null);
} finally {
  setLoading(false);
}

    };

    fetchLead();
  }, [id]);

  if (loading) return <LoadingSkeleton/>;
  if (error)
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <button className="mt-4 px-3 py-2 border rounded" onClick={() => router.back()}>
          Back
        </button>
      </div>
    );

  if (!lead)
    return (
      <div className="p-6">
        <div className="text-gray-600">Lead not found.</div>
        <button className="mt-4 px-3 py-2 border rounded" onClick={() => router.back()}>
          Back
        </button>
      </div>
    );

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500">
              Lead ID: <span className="font-mono">{lead.leadId}</span>
            </p>
            <h1 className="text-2xl font-bold text-gray-800">{lead.customerService?.customerName ?? "-"}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {lead.customerService?.contactNumber ?? "-"} • {lead.customerService?.city ?? "-"}
              {lead.customerService?.state ? `, ${lead.customerService.state}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="px-3 py-2 rounded-md border hover:bg-gray-50">
              Back
            </button>
          </div>
        </div>

        <hr className="my-4" />

        {/* Products Section */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Products</h2>
          {lead.customerService?.products?.length ? (
            <div className="grid gap-3">
              {lead.customerService.products.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div>
                    <div className="font-medium text-gray-800">{p.productName}</div>
                    <div className="text-sm text-gray-600">Usage: {p.usage ?? "-"}</div>
                    <div className="text-sm text-gray-600">Size: {p.size ?? "-"}</div>
                  </div>
                  <div className="text-right text-sm text-gray-700">
                    <div>Qty: {p.quantity}</div>
                    <div>Target: {p.targetPrice ?? "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No products in this lead.</div>
          )}
        </section>

        {/* Assignment Section */}
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Assignment</h2>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="mb-1">Assigned employee: {lead.currentAssignedEmployee?.employeeName ?? "-"}</div>
            <div>Current status: {lead.currentStatus ?? "-"}</div>
          </div>
        </section>

        {/* Optional: Sourcing / Shipping / Sales */}
        {lead.sourcing && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Sourcing</h2>
            <div className="bg-gray-50 p-3 rounded-md">
              <div>Product: {lead.sourcing.productName ?? "-"}</div>
              <div>Company: {lead.sourcing.companyName ?? "-"}</div>
              <div>Unit price: {lead.sourcing.productUnitPrice ?? "-"}</div>
            </div>
          </section>
        )}

        {lead.shipping && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Shipping</h2>
            <div className="bg-gray-50 p-3 rounded-md">
              <div>Item: {lead.shipping.itemName ?? "-"}</div>
              <div>CTN: {lead.shipping.totalCTN ?? "-"}</div>
              <div>KG: {lead.shipping.totalKG ?? "-"}</div>
            </div>
          </section>
        )}

        {lead.sales && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Sales</h2>
            <div className="bg-gray-50 p-3 rounded-md">
              <div>Tracking: {lead.sales.trackingNumber ?? "-"}</div>
              <div>Warehouse receipt: {lead.sales.warehouseReceipt ?? "-"}</div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
