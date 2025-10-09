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
import type { Lead, Sourcing } from "@/types/leads";

// Base props for Sourcing form
interface BaseFormProps {
  employeeId: string;
  employeeName: string;
  employeeMongoId: string;
  inquiryData?: Sourcing;
  uploading: boolean;
  onFileUpload: (files: FileList) => Promise<string[]>;
  onSubmit: (formData: Sourcing) => Promise<void>;
}

export default function DepartmentInquiryPage() {
  const params = useParams();
  const rawLeadId = params?.id;
  const leadId = Array.isArray(rawLeadId) ? rawLeadId[0] : rawLeadId;

  const { session, loading } = useSession();

  const [inquiryData, setInquiryData] = useState<Lead | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    if (!leadId) return;

    setLoadingData(true);
    getLeadById(leadId)
      .then((res) => setInquiryData(res))
      .catch((err) => console.error("Error fetching inquiry:", err))
      .finally(() => setLoadingData(false));
  }, [leadId]);

  if (loading) return <LoadingSkeleton />;
  if (!session)
    return <p className="text-center mt-20 text-red-500">You must be logged in to access this page.</p>;
  if (loadingData) return <LoadingSkeleton />;
  if (!leadId)
    return <p className="text-center mt-20 text-red-500">Lead ID not found in URL!</p>;

  const employeeId = session.employeeId ?? "";
  const employeeName = session.name ?? "";
  const managerId = session.mongoId ?? "";

  // File upload handler
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

  // Submit handler
  const handleSubmit = async (formData: Sourcing) => {
    try {
      const payload = {
        leadId,
        employeeId,
        managerId,
        department: "sourcing",
        data: formData as unknown as Record<string, unknown>
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        {leadId ? "Edit" : "Add"} Sourcing Inquiry
      </h1>

      <SourcingForm
        employeeId={employeeId}
        employeeName={employeeName}
        employeeMongoId={managerId}
        inquiryData={inquiryDataForForm}
        uploading={uploadingFiles}
        onFileUpload={handleFileUpload}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
