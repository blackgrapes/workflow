"use client";

import { Plus } from "lucide-react";
import Input from "./Input";
import ProductInput from "./ProductInput";
import { useState } from "react";

export interface Product {
  id: number;
  name: string;
  qty: string;
  size: string;
  usage: string;
  price: string;
  file?: File;          // selected file
  imageUrl?: string;    // uploaded URL (hidden from UI)
  uploading?: boolean;
  statusMessage?: string; // status message for frontend
}

interface ProductSourcingFormProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  customerInfo: Record<string, string>;
  setCustomerInfo: (info: Record<string, string>) => void;
  onSubmit: () => void;
}

const ProductSourcingForm = ({
  products,
  setProducts,
  customerInfo,
  setCustomerInfo,
  onSubmit,
}: ProductSourcingFormProps) => {
  const [submitting, setSubmitting] = useState(false);

  const addProduct = () => {
    setProducts([
      ...products,
      { id: products.length + 1, name: "", qty: "", size: "", usage: "", price: "" },
    ]);
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleProductChange = (id: number, field: keyof Product, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleCustomerChange = (field: string, value: string) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  };

  const handleFileSelect = (file: File, productId: number) => {
    setProducts(products.map(p => p.id === productId ? { ...p, file, statusMessage: "" } : p));
  };

  const uploadAllFiles = async () => {
    const updatedProducts = [...products];
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    for (let i = 0; i < updatedProducts.length; i++) {
      const p = updatedProducts[i];
      if (p.file && !p.imageUrl) {
        updatedProducts[i].uploading = true;
        updatedProducts[i].statusMessage = "";
        setProducts([...updatedProducts]);

        const formData = new FormData();
        formData.append("file", p.file);
        formData.append("upload_preset", uploadPreset!);

        try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
          const data = await res.json();

          updatedProducts[i].imageUrl = data.secure_url;
          updatedProducts[i].uploading = false;
          updatedProducts[i].statusMessage = `This is submitted: ${p.file.name}`;
        } catch (error) {
          updatedProducts[i].uploading = false;
          updatedProducts[i].statusMessage = `Upload failed: ${p.file?.name}`;
        }

        setProducts([...updatedProducts]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); // disable button
    await uploadAllFiles();

    const allUploaded = products.every(p => p.imageUrl && !p.uploading);
    if (allUploaded) {
      onSubmit();
    }
    setSubmitting(false); // re-enable button
  };

  return (
    <form className="space-y-10" onSubmit={handleSubmit}>
      {/* Customer Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          id="customerName"
          label="Customer Name"
          placeholder="Enter customer name"
          value={customerInfo.customerName}
          onChange={(e) => handleCustomerChange("customerName", e.target.value)}
        />
        <Input
          id="contactNumber"
          label="Contact Number"
          placeholder="Enter contact number"
          value={customerInfo.contactNumber}
          onChange={(e) => handleCustomerChange("contactNumber", e.target.value)}
        />
        <Input
          id="address"
          label="Address"
          placeholder="Enter address"
          value={customerInfo.address}
          onChange={(e) => handleCustomerChange("address", e.target.value)}
        />
        <Input
          id="city"
          label="City"
          placeholder="Enter city"
          value={customerInfo.city}
          onChange={(e) => handleCustomerChange("city", e.target.value)}
        />
        <Input
          id="state"
          label="State"
          placeholder="Enter state"
          value={customerInfo.state}
          onChange={(e) => handleCustomerChange("state", e.target.value)}
        />
      </div>

      {/* Products */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700">Products</h2>
        {products.map((product, idx) => (
          <div key={product.id} className="space-y-4">
            <ProductInput
              product={product}
              index={idx}
              removeProduct={removeProduct}
              onChange={handleProductChange}
              isRemovable={products.length > 1}
            />

            {/* File Input */}
            <div>
              <label htmlFor={`file-${product.id}`} className="block text-gray-700 font-medium mb-1">
                Upload Photos/Videos
              </label>
              <input
                id={`file-${product.id}`}
                type="file"
                multiple={false}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0], product.id);
                  }
                }}
                className="w-full border rounded-md p-2"
              />
              {product.uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {product.statusMessage && (
                <p className={`text-sm mt-1 ${product.statusMessage.startsWith("Upload failed") ? "text-red-600" : "text-green-600"}`}>
                  {product.statusMessage}
                </p>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addProduct}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition text-base"
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
