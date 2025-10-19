"use client";

import { useEffect, useState } from "react";
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

import type { Lead, Sourcing, Sales, Shipping } from "@/types/leads";
import SalesForm from "../../component/departmentDetailsUpdate/salesForm";

export default function DepartmentInquiryPage() {
  const params = useParams();
  const rawLeadId = params?.id;
  const leadId = Array.isArray(rawLeadId) ? rawLeadId[0] : rawLeadId;

  const { session, loading } = useSession();

  const [inquiryData, setInquiryData] = useState<Lead | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [salesData, setSalesData] = useState<Sales | undefined>(undefined);

  // 🔹 Shipping state matches ShippingForm expected type
  const [shippingData, setShippingData] = useState<{
    itemName?: string;
    shipmentMode?: string;
    freightRate?: number;
  } | undefined>(undefined);

  useEffect(() => {
    if (!leadId) return;

    setLoadingData(true);
    getLeadById(leadId)
      .then((res) => {
        if (!res) return;

        setInquiryData(res);

        // ✅ Map shipping data to match ShippingForm props
        if (res.shipping) {
          const shippingObj: Shipping = Array.isArray(res.shipping)
            ? res.shipping[0]
            : res.shipping;
          setShippingData({
            itemName: shippingObj.itemName ?? "",
            shipmentMode: shippingObj.shipmentMode ?? "",
            freightRate: shippingObj.freightRate
              ? Number(shippingObj.freightRate)
              : undefined,
          });
        } else {
          setShippingData(undefined);
        }

        setSalesData(res.sales ?? undefined);
      })
      .catch((err) => console.error("Error fetching inquiry:", err))
      .finally(() => setLoadingData(false));
  }, [leadId]);

  if (loading) return <LoadingSkeleton />;
  if (!session)
    return (
      <p className="text-center mt-20 text-red-500">
        You must be logged in to access this page.
      </p>
    );
  if (loadingData) return <LoadingSkeleton />;
  if (!leadId)
    return (
      <p className="text-center mt-20 text-red-500">
        Lead ID not found in URL!
      </p>
    );

  const employeeId = session.employeeId ?? "";
  const employeeName = session.name ?? "";
  const managerId = session.mongoId ?? "";
  const department = session.department?.toLowerCase() ?? "";

  // 🔹 File upload handler
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

  // 🔹 Submit handler (for Sourcing only, Shipping updates internally)
  const handleSubmit = async (formData: Sourcing) => {
    try {
      const payload = {
        leadId,
        employeeId,
        managerId,
        department,
        data:
          department === "sourcing"
            ? { ...formData }
            : { shipping: shippingData },
      };

      const result = await submitDepartmentData(payload);
      if (result.success) alert("Data submitted successfully!");
      else alert(`Failed to submit: ${result.message}`);
    } catch (err) {
      console.error("handleSubmit error:", err);
      alert("Failed to submit data");
    }
  };

  const inquiryDataForForm = inquiryData?.sourcing;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      <h1 className="text-xl font-bold mb-4">
        {leadId ? "Edit" : "Add"} {department?.toUpperCase()} Inquiry
      </h1>

      {/* 🔹 Sourcing */}
      {department === "sourcing" && inquiryDataForForm && (
        <SourcingForm
          employeeId={employeeId}
          employeeName={employeeName}
          employeeMongoId={managerId}
          inquiryData={inquiryDataForForm}
          uploading={uploadingFiles}
          onFileUpload={handleFileUpload}
          onSubmit={handleSubmit}
        />
      )}

      {/* 🔹 Shipping */}
      {department === "shipping" && (
        <div className="mt-10 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Shipping Details
          </h2>
          <ShippingForm
            initialData={shippingData}
            employeeId={employeeId}
            managerId={managerId}
            leadId={leadId}
            onUpdateSuccess={() => {
              alert("Shipping info updated!");
            }}
          />
        </div>
      )}

      {/* 🔹 Sales */}
      {department === "sales" && (
        <div className="mt-10 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Sales Details
          </h2>
          <SalesForm
            inquiryData={salesData}
            employeeId={employeeId}
            employeeName={employeeName}
            employeeMongoId={managerId}
            uploading={uploadingFiles}
            onFileUpload={handleFileUpload}
             leadId={leadId}
          />
        </div>
      )}
    </div>
  );
}

