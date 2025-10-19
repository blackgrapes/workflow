"use client";

import { useState } from "react";
import ProductSourcingForm from "./ProductSourcingForm";
import ShippingHelpForm from "./ShippingHelpForm";

export interface Product {
  id: number;
  name: string;
  qty: string;
  size: string;
  usage: string;
  price: string;
  imageUrl?: string; // for Cloudinary image
}

interface CustomerInquiryPageProps {
  onSubmit: (data: {
    type: "sourcing" | "shipping";
    customerInfo: Record<string, string>;
    products?: Product[];
    shippingInfo?: Record<string, string>;
    employeeId?: string;
    employeeName?: string;
    employeeMongoId?: string; // ✅ MongoDB ObjectId
  }) => void;
  employeeId?: string;
  employeeName?: string;
  employeeMongoId?: string; // ✅ MongoDB ObjectId
}

export default function CustomerInquiryPage({
  onSubmit,
  employeeId,
  employeeName,
  employeeMongoId,
}: CustomerInquiryPageProps) {
  const [tab, setTab] = useState<"sourcing" | "shipping">("sourcing");
  const [shippingInfo, setShippingInfo] = useState<Record<string, string>>({});

  const handleShippingSubmit = () => {
    onSubmit({
      type: "shipping",
      customerInfo: shippingInfo,
      employeeId,
      employeeName,
      employeeMongoId,
    });
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-teal-700 mb-10">
        Customer Inquiry Department
      </h1>

      <div className="bg-white shadow-xl rounded-3xl p-8 md:p-10">
        {/* Tabs */}
        <div className="flex gap-6 border-b mb-10">
          <button
            onClick={() => setTab("sourcing")}
            title="Switch to Product Sourcing"
            aria-label="Product Sourcing Tab"
            className={`pb-3 px-5 font-medium text-lg transition ${
              tab === "sourcing"
                ? "border-b-4 border-teal-600 text-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Product Sourcing
          </button>
          <button
            onClick={() => setTab("shipping")}
            title="Switch to Shipping Help"
            aria-label="Shipping Help Tab"
            className={`pb-3 px-5 font-medium text-lg transition ${
              tab === "shipping"
                ? "border-b-4 border-teal-600 text-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Shipping Help
          </button>
        </div>

        {/* Independent Sourcing Form */}
        {tab === "sourcing" && (
          <ProductSourcingForm
            employeeId={employeeId}
            employeeName={employeeName}
            employeeMongoId={employeeMongoId} // ✅ Pass MongoDB ID
          />
        )}

        {/* Shipping form */}
        {tab === "shipping" && (
          <ShippingHelpForm
            shippingInfo={shippingInfo}
            setShippingInfo={setShippingInfo}
            onSubmit={handleShippingSubmit}
          />
        )}
      </div>
    </div>
  );
}
