"use client";

import CustomerInquiryPage from "../component/CustomerInquiry/CustomerInquiryPage";
import LoadingSkeleton from "@/app/component/loading/loading";
import { useSession } from "@/lib/frontendApis/login/session";
import { submitCustomerInquiry } from "@/lib/frontendApis/employees/apis";

export default function CustomerInquiry() {
  const { session, loading } = useSession();

  // Show loader while session is fetching
  if (loading) return <LoadingSkeleton />;

  // If no session, prevent access
  if (!session)
    return (
      <p className="text-center mt-20 text-red-500">
        You must be logged in to submit inquiries.
      </p>
    );

  // Extract employee info from session
  const employeeId = session.employeeId; // legacy ID
  const employeeName = session.name;
  const employeeMongoId = session.mongoId; // ✅ MongoDB ObjectId

  // Handle form submission
  const handleSubmit = async (data: {
    type: "sourcing" | "shipping";
    customerInfo: unknown;
    products?: unknown;
    shippingInfo?: unknown;
  }) => {
    try {
      // Build payload with MongoDB ObjectId
      const payload = {
        ...data,
        employee: {
          employeeId, // legacy ID
          employeeName,
          mongoId: employeeMongoId, // ✅ MongoDB ObjectId
        },
      };

      console.log("🟢 Submitting payload:", payload);

      const resData = await submitCustomerInquiry(payload);

      console.log("🟢 Inquiry submitted successfully:", resData);
      alert("Inquiry submitted successfully!");
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? err
          : new Error("Something went wrong while submitting the inquiry.");
      console.error("❌ Error submitting inquiry:", error);
      alert(error.message);
    }
  };

  return (
    <CustomerInquiryPage
      onSubmit={handleSubmit}
      employeeId={employeeId}
      employeeName={employeeName}
      employeeMongoId={employeeMongoId} // ✅ pass MongoDB ID to child
    />
  );
}
