"use client";

import { Plus } from "lucide-react";
import ProductInput from "./ProductInput";
import { useState, useEffect } from "react";

export interface Product {
  id: number;
  name: string;
  qty: string;
  size: string;
  usage: string;
  price: string;
  files?: File[];
  imageUrls?: string[];
  uploading?: boolean;
  statusMessages?: string[];
  remark?: string;
}

export interface LeadPayload {
  leadId: string;
  type: "sourcing" | "shipping";
  employee: {
    mongoId: string;
    employeeName: string;
    employeeId?: string;
  };
  customerInfo: Record<string, string>;
  products: Array<{
    productName?: string;
    quantity?: number;
    size?: string;
    usage?: string;
    targetPrice?: number;
    uploadFiles?: string[];
    remark?: string;
  }>;
}

interface ProductSourcingFormProps {
  employeeId?: string;
  employeeName?: string;
  employeeMongoId?: string;
}

const ProductSourcingForm = ({
  employeeId,
  employeeName,
  employeeMongoId,
}: ProductSourcingFormProps) => {
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "", qty: "", size: "", usage: "", price: "", remark: "" },
  ]);
  const [customerInfo, setCustomerInfo] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Validation states
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});
  const [productErrors, setProductErrors] = useState<Record<number, string[]>>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Auto-generate "marka"
  useEffect(() => {
    const name = customerInfo.customerName?.trim().toUpperCase() || "";
    const city = customerInfo.city?.trim().toUpperCase() || "";
    if (name && city) {
      const marka = `DTC-${name[0]}${city[0]}`;
      setCustomerInfo((prev) => ({ ...prev, marka }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerInfo.customerName, customerInfo.city]);

  // Product CRUD
  const addProduct = () =>
    setProducts((prev) => [
      ...prev,
      { id: prev.length + 1, name: "", qty: "", size: "", usage: "", price: "", remark: "" },
    ]);

  const removeProduct = (id: number) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  const handleProductChange = (id: number, field: keyof Product, value: string) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const handleCustomerChange = (field: string, value: string) =>
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));

  const handleFileSelect = (files: File[], productId: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, files, statusMessages: Array(files.length).fill("") }
          : p
      )
    );
  };

  // Cloudinary upload
  const uploadAllFiles = async (): Promise<Product[]> => {
    const updated = [...products];
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

    for (let i = 0; i < updated.length; i++) {
      const p = updated[i];
      if (p.files?.length) {
        updated[i].uploading = true;
        updated[i].statusMessages = Array(p.files.length).fill("");
        updated[i].imageUrls = [];

        for (let j = 0; j < p.files.length; j++) {
          const file = p.files[j];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);

          try {
            const res = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
              { method: "POST", body: formData }
            );
            const data = await res.json();
            updated[i].imageUrls!.push(data.secure_url);
            updated[i].statusMessages![j] = `Uploaded: ${file.name}`;
          } catch {
            updated[i].statusMessages![j] = `Failed: ${file.name}`;
          }
        }

        updated[i].uploading = false;
      }
    }

    setProducts(updated);
    return updated;
  };

  // Validation logic (returns true if valid)
  const validateForm = (): boolean => {
    const cErrors: Record<string, string> = {};
    const pErrors: Record<number, string[]> = {};
    const missing: string[] = [];

    // Customer validations (required fields)
    if (!customerInfo.customerName || !customerInfo.customerName.trim()) {
      cErrors.customerName = "Customer name is required";
      missing.push("Customer Name");
    }
    if (!customerInfo.contactNumber || !customerInfo.contactNumber.trim()) {
      cErrors.contactNumber = "Contact number is required";
      missing.push("Contact Number");
    }
    if (!customerInfo.city || !customerInfo.city.trim()) {
      cErrors.city = "City is required";
      missing.push("City");
    }

    // Per-product validations
    products.forEach((p, idx) => {
      const errs: string[] = [];
      const productLabel = `Product ${idx + 1}`;
      if (!p.name || !p.name.trim()) {
        errs.push("Name is required");
        missing.push(`${productLabel} - Name`);
      }
      // qty should be a positive number
      if (!p.qty || !p.qty.trim()) {
        errs.push("Quantity is required");
        missing.push(`${productLabel} - Quantity`);
      } else {
        const qtyNum = Number(p.qty);
        if (Number.isNaN(qtyNum) || qtyNum <= 0) {
          errs.push("Quantity must be a valid number > 0");
          missing.push(`${productLabel} - Quantity (invalid)`);
        }
      }
      if (!p.price || !p.price.trim()) {
        errs.push("Target price is required");
        missing.push(`${productLabel} - Target Price`);
      } else {
        const priceNum = Number(p.price);
        if (Number.isNaN(priceNum) || priceNum < 0) {
          errs.push("Target price must be a valid number");
          missing.push(`${productLabel} - Target Price (invalid)`);
        }
      }

      if (errs.length) {
        pErrors[p.id] = errs;
      }
    });

    setCustomerErrors(cErrors);
    setProductErrors(pErrors);
    setMissingFields(missing);

    return Object.keys(cErrors).length === 0 && Object.keys(pErrors).length === 0;
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeMongoId || !employeeName) {
      alert("Employee information is missing or MongoDB ID is invalid");
      return;
    }

    const ok = validateForm();
    if (!ok) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    const uploaded = await uploadAllFiles();

    const allUploaded = uploaded.every(
      (p) => !p.uploading && p.imageUrls && p.imageUrls.length === (p.files?.length || 0)
    );

    if (!allUploaded) {
      alert("Some files failed to upload. Please retry.");
      setSubmitting(false);
      return;
    }

    const payload: LeadPayload = {
      leadId: `LEAD-${Date.now()}`,
      type: "sourcing",
      employee: {
        mongoId: employeeMongoId,
        employeeName,
        employeeId,
      },
      customerInfo,
      products: uploaded.map((p) => ({
        productName: p.name,
        quantity: Number(p.qty),
        size: p.size,
        usage: p.usage,
        targetPrice: Number(p.price),
        uploadFiles: p.imageUrls ?? [],
        remark: p.remark,
      })),
    };

    try {
      const res = await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Lead submitted successfully!");
        setCustomerInfo({});
        setProducts([{ id: 1, name: "", qty: "", size: "", usage: "", price: "", remark: "" }]);
        setCustomerErrors({});
        setProductErrors({});
        setMissingFields([]);
      } else {
        alert(`Error: ${data.message || "Failed to submit lead"}`);
      }
    } catch (err: unknown) {
      console.error(err);
      alert("Server error while submitting lead.");
    }

    setSubmitting(false);
  };

  // Helpers for stable layout: reserved space for error messages
  const ErrorSlot = ({ msg }: { msg?: string }) => (
    <p className="min-h-[20px] text-sm text-red-600 mt-2">{msg || ""}</p>
  );

  return (
    <form className="space-y-10" onSubmit={handleSubmit}>
      {/* Show missing fields summary if any */}
      {missingFields.length > 0 && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded-md p-4">
          <strong className="block mb-2">Please fix the following required fields:</strong>
          <ul className="list-disc pl-5 space-y-1">
            {missingFields.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Customer Info - using inline fields with reserved error slots to avoid content jump */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Name */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
          <div className="bg-white rounded-md border border-gray-200 px-4 py-3">
            <input
              id="customerName"
              className="w-full outline-none text-base"
              placeholder="Enter customer name"
              value={customerInfo.customerName || ""}
              onChange={(e) => handleCustomerChange("customerName", e.target.value)}
            />
          </div>
          <ErrorSlot msg={customerErrors.customerName} />
        </div>

        {/* Contact Number */}
        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
          <div className="bg-white rounded-md border border-gray-200 px-4 py-3">
            <input
              id="contactNumber"
              className="w-full outline-none text-base"
              placeholder="Enter contact number"
              value={customerInfo.contactNumber || ""}
              onChange={(e) => handleCustomerChange("contactNumber", e.target.value)}
            />
          </div>
          <ErrorSlot msg={customerErrors.contactNumber} />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <div className="bg-white rounded-md border border-gray-200 px-4 py-3">
            <input
              id="address"
              className="w-full outline-none text-base"
              placeholder="Enter address"
              value={customerInfo.address || ""}
              onChange={(e) => handleCustomerChange("address", e.target.value)}
            />
          </div>
          <ErrorSlot msg={customerErrors.address} />
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <div className="bg-white rounded-md border border-gray-200 px-4 py-3">
            <input
              id="city"
              className="w-full outline-none text-base"
              placeholder="Enter city"
              value={customerInfo.city || ""}
              onChange={(e) => handleCustomerChange("city", e.target.value)}
            />
          </div>
          <ErrorSlot msg={customerErrors.city} />
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <div className="bg-white rounded-md border border-gray-200 px-4 py-3">
            <input
              id="state"
              className="w-full outline-none text-base"
              placeholder="Enter state"
              value={customerInfo.state || ""}
              onChange={(e) => handleCustomerChange("state", e.target.value)}
            />
          </div>
          <ErrorSlot msg={customerErrors.state} />
        </div>

        {/* Marka (readonly) */}
        <div>
          <label htmlFor="marka" className="block text-sm font-medium text-gray-700 mb-2">Shipping Mark</label>
          <div className="bg-gray-50 rounded-md border border-gray-200 px-4 py-3">
            <input
              id="marka"
              className="w-full outline-none text-base"
              placeholder="Auto generated"
              value={customerInfo.marka || ""}
              readOnly
            />
          </div>
          <ErrorSlot />
        </div>
      </div>

      {/* Products */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700">Products</h2>
        {products.map((product, idx) => (
          <div key={product.id} className="space-y-4 border rounded-md p-4">
            <ProductInput
              product={product}
              index={product.id}
              removeProduct={removeProduct}
              onChange={handleProductChange}
              isRemovable={products.length > 1}
            />

            {/* Show product-specific validation errors (reserved space) */}
            <div className="min-h-[40px]">
              {productErrors[product.id] ? (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-md p-2">
                  <ul className="list-disc pl-5 text-sm">
                    {productErrors[product.id].map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                // keep the vertical space constant when no errors
                <div className="h-[36px]" />
              )}
            </div>

            <div>
              <label htmlFor={`file-${product.id}`} className="block text-gray-700 font-medium mb-1">
                Upload Photos/Videos
              </label>
              <input
                id={`file-${product.id}`}
                type="file"
                multiple
                onChange={(e) =>
                  e.target.files &&
                  handleFileSelect(Array.from(e.target.files), product.id)
                }
                className="w-full border rounded-md p-2"
              />
              <div className="min-h-[20px]">
                {product.uploading && (
                  <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                )}
                {product.statusMessages?.map((msg, idx2) => (
                  <p
                    key={idx2}
                    className={`text-sm mt-1 ${msg.startsWith("Failed") ? "text-red-600" : "text-green-600"}`}
                  >
                    {msg}
                  </p>
                ))}
              </div>
            </div>

            {/* Per-product remark */}
            <div>
              <label htmlFor={`product-remark-${product.id}`} className="block text-gray-700 font-medium mb-1">
                Product Remark
              </label>
              <textarea
                id={`product-remark-${product.id}`}
                placeholder="Enter remark specific to this product (optional)"
                value={product.remark || ""}
                onChange={(e) => handleProductChange(product.id, "remark", e.target.value)}
                className="w-full border rounded-md p-2 h-20"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addProduct}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition"
        >
          <Plus size={20} /> Add Another Product
        </button>
      </div>

      {/* Submit */}
      <div className="text-center">
        <button
          type="submit"
          disabled={submitting}
          className={`px-10 py-4 rounded-2xl shadow-lg text-lg font-semibold transition text-white ${
            submitting ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
          }`}
        >
          {submitting ? "Uploading..." : "Submit Inquiry"}
        </button>
      </div>
    </form>
  );
};

export default ProductSourcingForm;
