"use client";

import { useState, useEffect } from "react";
import type { Sales } from "@/types/leads";

// 🔹 Each sales item for the form
export interface SalesFormProduct {
  product: string;
  trackingNumber: string;
  warehouseReceipt?: string;
}

// 🔹 Full sales form data
export interface SalesFormData {
  products: SalesFormProduct[];
}

// 🔹 Props for SalesForm
interface SalesFormProps {
  leadId: string; // Pass leadId explicitly from parent
  employeeId: string;
  employeeName: string;
  employeeMongoId: string; // corresponds to managerId in parent
  inquiryData?: Sales; // Lead["sales"] is a single object
  uploading: boolean;
  onFileUpload: (files: FileList) => Promise<string[]>;
}

export default function SalesForm({
  leadId,
  employeeId,
  employeeName,
  employeeMongoId,
  inquiryData,
  uploading,
  onFileUpload,
}: SalesFormProps) {
  const [products, setProducts] = useState<SalesFormProduct[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Map the single Sales object to array for the form
  useEffect(() => {
    if (inquiryData) {
      setProducts([
        {
          product: inquiryData.trackingNumber || "",
          trackingNumber: inquiryData.trackingNumber || "",
          warehouseReceipt: inquiryData.warehouseReceipt || "",
        },
      ]);
    } else {
      setProducts([{ product: "", trackingNumber: "", warehouseReceipt: "" }]);
    }
  }, [inquiryData]);

  const handleChange = (
    index: number,
    key: keyof SalesFormProduct,
    value: string
  ) => {
    setProducts((prev) => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });
  };

  const handleFileChange = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const urls = await onFileUpload(files);
    handleChange(index, "warehouseReceipt", urls[0] || "");
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      { product: "", trackingNumber: "", warehouseReceipt: "" },
    ]);
  };

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔹 Submit Sales Data to API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        leadId,
        employeeId,
        employeeName,
        managerId: employeeMongoId,
        salesData: products, // array of products
      };

      const res = await fetch("/api/employee/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit sales data");

      alert("Sales data submitted successfully!");
    } catch (err: unknown) {
  if (err instanceof Error) {
    console.error("SalesForm submit error:", err);
    alert(err.message);
  } else {
    console.error("SalesForm submit error:", err);
    alert("Failed to submit sales data");
  }
}
 finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {products.map((prod, idx) => (
        <div key={idx} className="border rounded p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            {/* Product Name */}
            <div className="flex-1">
              <label
                htmlFor={`product-${idx}`}
                className="block text-sm font-medium text-gray-700"
              >
                Product
              </label>
              <input
                id={`product-${idx}`}
                type="text"
                value={prod.product}
                onChange={(e) => handleChange(idx, "product", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Tracking Number */}
            <div className="flex-1">
              <label
                htmlFor={`tracking-${idx}`}
                className="block text-sm font-medium text-gray-700"
              >
                Tracking Number
              </label>
              <input
                id={`tracking-${idx}`}
                type="text"
                value={prod.trackingNumber}
                onChange={(e) =>
                  handleChange(idx, "trackingNumber", e.target.value)
                }
                className="mt-1 block w-full border rounded px-3 py-2"
                placeholder="Enter tracking number"
                required
              />
            </div>

            {/* Warehouse Receipt */}
            <div className="flex-1">
              <label
                htmlFor={`warehouse-${idx}`}
                className="block text-sm font-medium text-gray-700"
              >
                Warehouse Receipt
              </label>
              <input
                id={`warehouse-${idx}`}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(idx, e.target.files)}
                className="mt-1 block w-full"
              />
              {prod.warehouseReceipt && (
                <p className="mt-1 text-sm text-gray-500 truncate">
                  {prod.warehouseReceipt}
                </p>
              )}
            </div>

            {/* Remove button */}
            <div className="flex items-center gap-2">
              {products.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProduct(idx)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Add / Submit Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={addProduct}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Add Product
        </button>

        <button
          type="submit"
          disabled={uploading || submitting}
          className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50"
        >
          {uploading || submitting ? "Submitting..." : "Submit Sales Data"}
        </button>
      </div>
    </form>
  );
}
