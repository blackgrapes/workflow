"use client";

import { Plus } from "lucide-react";
import Input from "./Input";
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
  remark?: string; // <-- added per-product remark
}

export interface LeadPayload {
  leadId: string;
  type: "sourcing" | "shipping";
  employee: {
    mongoId: string; // ✅ MongoDB ObjectId
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
    remark?: string; // <-- included remark in payload product
  }>;
}

interface ProductSourcingFormProps {
  employeeId?: string;       // legacy ID (optional)
  employeeName?: string;
  employeeMongoId?: string;  // ✅ MongoDB ObjectId
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

  // Auto-generate "marka"
  useEffect(() => {
    const name = customerInfo.customerName?.trim().toUpperCase() || "";
    const city = customerInfo.city?.trim().toUpperCase() || "";
    if (name && city) {
      const marka = `DTC-${name[0]}${city[0]}`;
      setCustomerInfo({ ...customerInfo, marka });
    }
  }, [customerInfo.customerName, customerInfo.city]);

  // Product CRUD
  const addProduct = () =>
    setProducts([
      ...products,
      { id: products.length + 1, name: "", qty: "", size: "", usage: "", price: "", remark: "" },
    ]);

  const removeProduct = (id: number) =>
    setProducts(products.filter((p) => p.id !== id));

  const handleProductChange = (id: number, field: keyof Product, value: string) =>
    setProducts(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const handleCustomerChange = (field: string, value: string) =>
    setCustomerInfo({ ...customerInfo, [field]: value });

  const handleFileSelect = (files: File[], productId: number) => {
    setProducts(
      products.map((p) =>
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

    setProducts(updated); // ✅ finally update state once
    return updated;
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeMongoId || !employeeName) {
      alert("Employee information is missing or MongoDB ID is invalid");
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
        remark: p.remark, // <-- include per-product remark in payload
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
      } else {
        alert(`Error: ${data.message || "Failed to submit lead"}`);
      }
    } catch (err: unknown) {
      console.error(err);
      alert("Server error while submitting lead.");
    }

    setSubmitting(false);
  };

  return (
    <form className="space-y-10" onSubmit={handleSubmit}>
      {/* Customer Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          id="customerName"
          label="Customer Name"
          placeholder="Enter customer name"
          value={customerInfo.customerName || ""}
          onChange={(e) => handleCustomerChange("customerName", e.target.value)}
        />
        <Input
          id="contactNumber"
          label="Contact Number"
          placeholder="Enter contact number"
          value={customerInfo.contactNumber || ""}
          onChange={(e) => handleCustomerChange("contactNumber", e.target.value)}
        />
        <Input
          id="address"
          label="Address"
          placeholder="Enter address"
          value={customerInfo.address || ""}
          onChange={(e) => handleCustomerChange("address", e.target.value)}
        />
        <Input
          id="city"
          label="City"
          placeholder="Enter city"
          value={customerInfo.city || ""}
          onChange={(e) => handleCustomerChange("city", e.target.value)}
        />
        <Input
          id="state"
          label="State"
          placeholder="Enter state"
          value={customerInfo.state || ""}
          onChange={(e) => handleCustomerChange("state", e.target.value)}
        />
        <Input
          id="marka"
          label="Shipping Mark"
          placeholder="Auto generated"
          value={customerInfo.marka || ""}
          readOnly
        />
      </div>

      {/* Products */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700">Products</h2>
        {products.map((product) => (
          <div key={product.id} className="space-y-4">
            <ProductInput
              product={product}
              index={product.id}
              removeProduct={removeProduct}
              onChange={handleProductChange}
              isRemovable={products.length > 1}
            />
            <div>
              <label
                htmlFor={`file-${product.id}`}
                className="block text-gray-700 font-medium mb-1"
              >
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
              {product.uploading && (
                <p className="text-sm text-gray-500 mt-1">Uploading...</p>
              )}
              {product.statusMessages?.map((msg, idx) => (
                <p
                  key={idx}
                  className={`text-sm mt-1 ${
                    msg.startsWith("Failed") ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {msg}
                </p>
              ))}
            </div>

            {/* Per-product remark */}
            <div>
              <label
                htmlFor={`product-remark-${product.id}`}
                className="block text-gray-700 font-medium mb-1"
              >
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
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700"
          }`}
        >
          {submitting ? "Uploading..." : "Submit Inquiry"}
        </button>
      </div>
    </form>
  );
};

export default ProductSourcingForm;
