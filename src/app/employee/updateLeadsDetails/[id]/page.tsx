// src/app/leads/[id]/department-page.tsx
"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LoadingSkeleton from "@/app/component/loading/loading";
import { useSession } from "@/lib/frontendApis/login/session";
import {
  getLeadById,
  uploadToCloudinary,
  submitDepartmentData,
} from "@/lib/frontendApis/employees/apis";

import SourcingForm from "../../component/departmentDetailsUpdate/SourcingForm";
import ShippingForm from "../../component/departmentDetailsUpdate/ShippingForm";
import SalesForm from "../../component/departmentDetailsUpdate/salesForm";

import type { Lead, Sourcing, Sales, Shipping } from "@/types/leads";
import type { DepartmentPayload as APIDepartmentPayload } from "@/lib/frontendApis/employees/apis";
import FullDetails from "../../component/add-details/fullDetails";

import { Info, FileText, RefreshCw } from "lucide-react";

/** Safe extractor for API responses that may be either { data: Lead } or Lead */
function extractLead(resp: unknown): Lead | null {
  if (!resp || typeof resp !== "object") return null;

  if (Object.prototype.hasOwnProperty.call(resp, "data")) {
    const r = resp as Record<string, unknown>;
    const maybeData = r.data;
    if (maybeData && typeof maybeData === "object") return maybeData as Lead;
  }

  if (Object.prototype.hasOwnProperty.call(resp, "leadId")) {
    return resp as Lead;
  }

  return null;
}

export default function DepartmentInquiryPage(): ReactNode {
  const params = useParams();
  const rawLeadId = params?.id;
  const leadId = Array.isArray(rawLeadId) ? rawLeadId[0] : rawLeadId;

  const { session, loading } = useSession();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [salesData, setSalesData] = useState<Sales | undefined>(undefined);
  const [shippingData, setShippingData] = useState<Shipping | undefined>(undefined);

  useEffect(() => {
    if (!leadId) return;

    setLoadingData(true);
    setFetchError(null);

    (async () => {
      try {
        const res = await getLeadById(leadId);
        if (!res) {
          setFetchError("No inquiry found for this Lead ID.");
          setLead(null);
          return;
        }

        const leadObj = extractLead(res);
        if (!leadObj) {
          setFetchError("Unexpected response shape from API.");
          setLead(null);
          return;
        }

        setLead(leadObj);

        if (leadObj.shipping) {
          const shippingObj = Array.isArray(leadObj.shipping)
            ? (leadObj.shipping[0] as Shipping)
            : (leadObj.shipping as Shipping);

          const mappedShipping: Shipping = {
            ...shippingObj,
            itemName: shippingObj.itemName ?? "",
            shipmentMode: shippingObj.shipmentMode ?? "",
            freightRate:
              typeof shippingObj.freightRate === "string"
                ? Number(shippingObj.freightRate)
                : shippingObj.freightRate,
            logs: shippingObj.logs ?? [],
          };

          setShippingData(mappedShipping);
        } else {
          setShippingData(undefined);
        }

        setSalesData(leadObj.sales ?? undefined);
      } catch (err) {
        if (err instanceof Error) setFetchError(err.message);
        else setFetchError(String(err));
        setLead(null);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [leadId]);

  if (loading || loadingData) return <LoadingSkeleton />;

  if (!session) {
    return (
      <p className="text-center mt-20 text-red-500">You must be logged in to access this page.</p>
    );
  }

  if (!leadId) {
    return (
      <p className="text-center mt-20 text-red-500">Lead ID not found in URL!</p>
    );
  }

  if (fetchError) {
    return <p className="text-center mt-20 text-red-500">{fetchError}</p>;
  }

  const employeeId = session.employeeId ?? "";
  const employeeName = session.name ?? "";
  const managerId = session.mongoId ?? "";
  const department = session.department?.toLowerCase() ?? "";

  // upload helper (returns uploaded URLs)
  const handleFileUpload = async (files: FileList): Promise<string[]> => {
    setUploadingFiles(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadToCloudinary(files[i]);
        uploadedUrls.push(url);
      } catch (err) {
        console.error("File upload error:", err);
        alert(`Failed to upload file: ${files[i].name}`);
      }
    }

    setUploadingFiles(false);
    return uploadedUrls;
  };

  /**
   * Strictly-typed submit handler.
   * Use the API's DepartmentPayload type to avoid mismatch.
   */
  const handleSubmit = async (formData: Sourcing): Promise<void> => {
    if (!leadId) {
      alert("Missing leadId.");
      return;
    }

    try {
      let payload: APIDepartmentPayload;

      if (department === "sourcing") {
        // API expects a looser "data" shape (Record<string, unknown>) in some typings.
        // Cast the Sourcing object to a Record<string, unknown> to satisfy API type without `any`.
        payload = {
          leadId,
          employeeId,
          managerId,
          department: "sourcing",
          // cast to the broader shape API expects
          data: formData as unknown as Record<string, unknown>,
        } as APIDepartmentPayload;
      } else if (department === "shipping") {
        payload = {
          leadId,
          employeeId,
          managerId,
          department: "shipping",
          data: { shipping: shippingData } as unknown as Record<string, unknown>,
        } as APIDepartmentPayload;
      } else if (department === "sales") {
        payload = {
          leadId,
          employeeId,
          managerId,
          department: "sales",
          data: { sales: salesData } as unknown as Record<string, unknown>,
        } as APIDepartmentPayload;
      } else {
        payload = {
          leadId,
          employeeId,
          managerId,
          department: department || "unknown",
          data: {} as Record<string, unknown>,
        } as APIDepartmentPayload;
      }

      // submit with API's expected type
      const result = await submitDepartmentData(payload);

      if (result) {
        alert("Data submitted successfully!");
      } 
    } catch (err) {
      console.error("handleSubmit error:", err);
      alert("Failed to submit data");
    }
  };

  const inquiryDataForForm = lead?.sourcing;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-50 border border-indigo-100">
            <Info className="w-4 h-4 text-indigo-600" />
          </span>
          <span>{leadId ? "Edit" : "Add"} {department?.toUpperCase()} Inquiry</span>
        </h1>
        <div className="text-sm text-gray-600 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border">
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="font-mono">{lead?.leadId ?? "—"}</span>
          </span>

          <button
            onClick={() => {
              if (!leadId) return;
              // lightweight refresh by rerunning effect: update loadingData then re-fetch
              setLoadingData(true);
              void (async () => {
                try {
                  const res = await getLeadById(leadId);
                  const leadObj = extractLead(res);
                  setLead(leadObj);
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoadingData(false);
                }
              })();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border hover:bg-slate-50 text-sm"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        {/* top forms area */}
        <div className="space-y-6">
          {/* Sourcing */}
          {department === "sourcing" && (
            <>
              {inquiryDataForForm ? (
                <SourcingForm
                  employeeId={employeeId}
                  employeeName={employeeName}
                  employeeMongoId={managerId}
                  inquiryData={inquiryDataForForm}
                  uploading={uploadingFiles}
                  onFileUpload={handleFileUpload}
                  onSubmit={handleSubmit}
                />
              ) : (
                <p className="text-gray-500">Sourcing data not found for this lead.</p>
              )}
            </>
          )}

          {/* Shipping */}
          {department === "shipping" && (
            <div className="space-y-0">
              {shippingData ? (
                <ShippingForm
                  initialData={shippingData}
                  employeeId={employeeId}
                  managerId={managerId}
                  leadId={leadId}
                  onUpdateSuccess={() => alert("Shipping info updated!")}
                />
              ) : (
                <p className="text-gray-500">Shipping data not found for this lead.</p>
              )}
            </div>
          )}

          {/* Sales */}
          {department === "sales" && (
            <>
              {salesData ? (
                <SalesForm
                  inquiryData={salesData}
                  employeeId={employeeId}
                  employeeName={employeeName}
                  employeeMongoId={managerId}
                  uploading={uploadingFiles}
                  onFileUpload={handleFileUpload}
                  leadId={leadId}
                />
              ) : (
                <p className="text-gray-500">Sales data not found for this lead.</p>
              )}
            </>
          )}
        </div>

        {/* Full details shown below forms */}
        <div className="mt-6 border-t pt-6">
          <FullDetails lead={lead} />
        </div>
      </div>
    </div>
  );
}
