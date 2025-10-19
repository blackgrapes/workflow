"use client";

import { useState, useEffect } from "react";

// Shipping rate interface
interface ShippingRate {
  product: string;
  shipmentMode: string;
  freightRate: string; // string for input
}

// Props
interface ShippingFormProps {
  initialData?: {
    itemName?: string;
    shipmentMode?: string;
    freightRate?: number;
  };
  employeeId: string;
  managerId: string;
  leadId: string;
  onUpdateSuccess?: () => void;
}

export default function ShippingForm({
  initialData,
  employeeId,
  managerId,
  leadId,
  onUpdateSuccess,
}: ShippingFormProps) {
  const [shippingData, setShippingData] = useState<ShippingRate[]>([
    { product: "", shipmentMode: "", freightRate: "" },
  ]);
  const [loading, setLoading] = useState(false);

  // Pre-fill if data exists
  useEffect(() => {
    if (initialData) {
      setShippingData([
        {
          product: initialData.itemName || "",
          shipmentMode: initialData.shipmentMode || "",
          freightRate: initialData.freightRate?.toString() || "",
        },
      ]);
    }
  }, [initialData]);

  // handle input changes
  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updated = [...shippingData];
    updated[index] = { ...updated[index], [name]: value };
    setShippingData(updated);
  };

  // submit shipping
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const firstItem = shippingData[0];
    if (!firstItem.product || !firstItem.shipmentMode || !firstItem.freightRate) {
      alert("Please fill all fields before submitting.");
      return;
    }

    const payload = {
      leadId,
      employeeId,
      managerId,
      shipping: {
        itemName: firstItem.product,
        shipmentMode: firstItem.shipmentMode,
        freightRate: Number(firstItem.freightRate),
      },
    };

    setLoading(true);
    try {
      const res = await fetch("/api/employee/shipment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Shipping details submitted successfully!");
        onUpdateSuccess?.();
      } else {
        alert(`Submission failed: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-6"
    >
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left font-semibold text-gray-700">
                PRODUCT
              </th>
              <th className="border px-4 py-2 text-left font-semibold text-gray-700">
                SHIPMENT MODE
              </th>
              <th className="border px-4 py-2 text-left font-semibold text-gray-700">
                FREIGHT RATE
              </th>
            </tr>
          </thead>
          <tbody>
            {shippingData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    name="product"
                    value={item.product}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Enter product"
                    className="w-full border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                    required
                  />
                </td>
                <td className="border px-4 py-2">
                  <label htmlFor={`shipmentMode-${index}`} className="sr-only">
                    Shipment Mode
                  </label>
                  <select
                    id={`shipmentMode-${index}`}
                    name="shipmentMode"
                    value={item.shipmentMode}
                    onChange={(e) => handleChange(index, e)}
                    className="w-full border rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-300 focus:outline-none"
                    required
                  >
                    <option value="">Select</option>
                    <option value="SEA">SEA</option>
                    <option value="AIR">AIR</option>
                  </select>
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    name="freightRate"
                    value={item.freightRate}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="e.g. 20000"
                    className="w-full border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                    required
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 text-white rounded-md transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Submitting..." : "Submit Shipping Details"}
        </button>
      </div>
    </form>
  );
}
