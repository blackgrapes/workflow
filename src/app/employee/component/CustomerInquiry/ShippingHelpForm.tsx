// src/app/components/ShippingHelpForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import Input from "./Input";
import { uploadToCloudinary } from "@/lib/frontendApis/employees/apis";

interface ShippingHelpFormProps {
  shippingInfo: Record<string, string>;
  setShippingInfo: (info: Record<string, string>) => void;
  onSubmit: (shippingInfo: Record<string, string>) => Promise<void> | void;
}

const fields = [
  "Item Name",
  "Total CTN",
  "Total CBM",
  "Total KG",
  "Total Value",
  "Total PCS",
  "HSN Code",
  "Shipment Mode",
];

export default function ShippingHelpForm({
  shippingInfo,
  setShippingInfo,
  onSubmit,
}: ShippingHelpFormProps) {
  const [localInfo, setLocalInfo] = useState<Record<string, string>>(shippingInfo || {});

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [packingFile, setPackingFile] = useState<File | null>(null);
  const [invoiceName, setInvoiceName] = useState("");
  const [packingName, setPackingName] = useState("");

  // uploaded urls
  const [invoiceUrl, setInvoiceUrl] = useState<string>("");
  const [packingUrl, setPackingUrl] = useState<string>("");

  // upload states
  const [invoiceUploading, setInvoiceUploading] = useState<boolean>(false);
  const [packingUploading, setPackingUploading] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalInfo((prev) => {
      const prevKeys = Object.keys(prev);
      const propKeys = Object.keys(shippingInfo || {});
      if (prevKeys.length !== propKeys.length) return { ...(shippingInfo || {}) };
      for (const k of propKeys) {
        if ((prev as Record<string, string>)[k] !== (shippingInfo as Record<string, string>)[k]) {
          return { ...(shippingInfo || {}) };
        }
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingInfo]);

  const safeString = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    try {
      return String(v).trim();
    } catch {
      return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    const updated = { ...localInfo, [field]: value };
    setLocalInfo(updated);
    setShippingInfo(updated);
  };

  const handleFileChange = (
    setter: (f: File | null) => void,
    setName: (n: string) => void,
    setUrl: (u: string) => void,
    setUploading: (b: boolean) => void,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setter(file);
    setName(file ? file.name : "");

    // auto-upload on selection
    if (file) {
      setUploading(true);
      // upload and update url; swallow errors to show to user
      uploadAndExtractUrl(file)
        .then((url) => {
          if (url) setUrl(url);
        })
        .catch((err) => {
          console.error("Auto upload failed:", err);
          setError(err instanceof Error ? err.message : "Upload failed");
        })
        .finally(() => setUploading(false));
    } else {
      // clear url when file removed
      setUrl("");
    }
  };

  const isHttpUrl = (v: string): boolean => v.startsWith("http://") || v.startsWith("https://");

  const extractUrlFromResponse = (res: unknown): string | null => {
    if (!res) return null;
    if (typeof res === "string") return isHttpUrl(res) ? res : null;

    if (typeof res === "object") {
      const obj = res as Record<string, unknown>;
      const keysToTry = ["secure_url", "url", "secureUrl", "secureURL"];
      for (const k of keysToTry) {
        const val = obj[k];
        if (typeof val === "string" && isHttpUrl(val)) return val;
      }

      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === "string" && isHttpUrl(v)) return v;
        if (v && typeof v === "object") {
          const nested = v as Record<string, unknown>;
          for (const nk of Object.keys(nested)) {
            const nv = nested[nk];
            if (typeof nv === "string" && isHttpUrl(nv)) return nv;
          }
        }
      }
    }

    return null;
  };

  async function uploadAndExtractUrl(file: File, folder = "leads/tmp") {
    try {
      const raw = await uploadToCloudinary(file, { folder });
      const url = extractUrlFromResponse(raw);
      if (!url) throw new Error("Upload succeeded but no URL found in response.");
      return url;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Upload failed");
    }
  }

  /**
   * Upload strict with retries (used for manual submission fallback)
   */
  const uploadFileStrict = async (file: File, folder: string, maxRetries = 2): Promise<string> => {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const raw = await uploadToCloudinary(file, { folder });
        const url = extractUrlFromResponse(raw);
        if (!url) throw new Error("No valid URL extracted from upload response.");
        return url;
      } catch (err) {
        lastErr = err;
        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, 250 + attempt * 150));
          continue;
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Upload failed after retries");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // small visual feedback
      // We keep it simple — the green check plus copy behavior is enough
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      // If files selected but not yet uploaded (or upload failed) -> try uploading now
      if (invoiceFile && !invoiceUrl) {
        setInvoiceUploading(true);
        try {
          const url = await uploadFileStrict(invoiceFile, "leads/invoices");
          setInvoiceUrl(url);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Invoice upload failed");
          setSubmitting(false);
          setInvoiceUploading(false);
          return;
        } finally {
          setInvoiceUploading(false);
        }
      }

      if (packingFile && !packingUrl) {
        setPackingUploading(true);
        try {
          const url = await uploadFileStrict(packingFile, "leads/packings");
          setPackingUrl(url);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Packing upload failed");
          setSubmitting(false);
          setPackingUploading(false);
          return;
        } finally {
          setPackingUploading(false);
        }
      }

      // Final guard: if user selected files, ensure URLs exist
      if (invoiceFile && !invoiceUrl) {
        setError("Invoice must be uploaded before submit.");
        setSubmitting(false);
        return;
      }
      if (packingFile && !packingUrl) {
        setError("Packing list must be uploaded before submit.");
        setSubmitting(false);
        return;
      }

      const payload: Record<string, string> = { ...localInfo };
      if (invoiceUrl) payload.uploadInvoice = invoiceUrl;
      if (packingUrl) payload.uploadPackingList = packingUrl;

      // DEBUG log for developer
      console.groupCollapsed("[DEBUG] Final payload being sent to backend");
      console.log("payload:", JSON.stringify(payload, null, 2));
      console.groupEnd();

      await onSubmit(payload);

      // Post submit alert listing uploaded files
      const uploadedList: string[] = [];
      if (invoiceUrl) uploadedList.push(`Invoice: ${invoiceUrl}`);
      if (packingUrl) uploadedList.push(`Packing: ${packingUrl}`);

      if (uploadedList.length > 0) {
        window.alert("Uploaded:\n" + uploadedList.join("\n"));
      } else {
        window.alert("Submitted without uploads.");
      }

      // update parent/local state with final payload
      setLocalInfo(payload);
      setShippingInfo(payload);
    } catch (err) {
      console.error("[handleSubmit] unexpected error:", err);
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setSubmitting(false);
    }
  };

  const invoiceReady = Boolean(invoiceUrl) && !invoiceUploading;
  const packingReady = Boolean(packingUrl) && !packingUploading;

  const canSubmit = (() => {
    // If files selected, require their URLs
    if (invoiceFile && !invoiceReady) return false;
    if (packingFile && !packingReady) return false;
    return true;
  })();

  return (
    <form className="space-y-10" onSubmit={handleSubmit}>
      {/* Customer Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          id="s-customerName"
          label="Customer Name"
          placeholder="Enter customer name"
          value={localInfo.customerName || ""}
          onChange={(e) => handleChange("customerName", e.target.value)}
        />
        <Input
          id="s-contactNumber"
          label="Contact Number"
          placeholder="Enter contact number"
          value={localInfo.contactNumber || ""}
          onChange={(e) => handleChange("contactNumber", e.target.value)}
        />
        <Input
          id="s-address"
          label="Address"
          placeholder="Enter address"
          value={localInfo.address || ""}
          onChange={(e) => handleChange("address", e.target.value)}
        />
        <Input
          id="s-city"
          label="City"
          placeholder="Enter city"
          value={localInfo.city || ""}
          onChange={(e) => handleChange("city", e.target.value)}
        />
        <Input
          id="s-state"
          label="State"
          placeholder="Enter state"
          value={localInfo.state || ""}
          onChange={(e) => handleChange("state", e.target.value)}
        />
      </div>

      {/* Product Details */}
      <div className="border rounded-2xl p-6 bg-gray-50 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Shipping Product Details</h3>

        <div className="grid md:grid-cols-2 gap-5">
          {fields.map((field, idx) => (
            <Input
              key={idx}
              id={`ship-${idx}`}
              label={field}
              placeholder={field}
              value={localInfo[field] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          ))}
        </div>

        {/* Shipping Remark */}
        <div className="mt-4">
          <label htmlFor="shippingRemark" className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Remark
          </label>
          <textarea
            id="shippingRemark"
            placeholder="Enter remark for shipping (optional)"
            value={localInfo.remark || ""}
            onChange={(e) => handleChange("remark", e.target.value)}
            className="w-full border rounded-md p-2 h-24"
          />
        </div>

        {/* File Uploads */}
        <div className="grid md:grid-cols-2 gap-5 mt-4">
          <div>
            <label htmlFor="uploadInvoice" className="block text-sm font-medium text-gray-700 mb-1">Upload Invoice</label>
            <input
              id="uploadInvoice"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) =>
                handleFileChange(setInvoiceFile, setInvoiceName, setInvoiceUrl, setInvoiceUploading, e)
              }
              className="block w-full text-sm text-gray-700"
            />
            {invoiceName && <div className="mt-2 text-sm text-gray-600">{invoiceName}</div>}

            {/* status */}
            <div className="mt-2 text-sm">
              {invoiceUploading && <span>Uploading...</span>}
              {invoiceReady && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Uploaded</span>
                  <button type="button" onClick={() => copyToClipboard(invoiceUrl)} className="text-xs underline">Copy URL</button>
                </div>
              )}
              {invoiceUrl && (
                <div className="mt-1 break-all text-xs text-gray-700">{invoiceUrl}</div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="uploadPackingList" className="block text-sm font-medium text-gray-700 mb-1">Upload Packing List</label>
            <input
              id="uploadPackingList"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) =>
                handleFileChange(setPackingFile, setPackingName, setPackingUrl, setPackingUploading, e)
              }
              className="block w-full text-sm text-gray-700"
            />
            {packingName && <div className="mt-2 text-sm text-gray-600">{packingName}</div>}

            {/* status */}
            <div className="mt-2 text-sm">
              {packingUploading && <span>Uploading...</span>}
              {packingReady && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Uploaded</span>
                  <button type="button" onClick={() => copyToClipboard(packingUrl)} className="text-xs underline">Copy URL</button>
                </div>
              )}
              {packingUrl && (
                <div className="mt-1 break-all text-xs text-gray-700">{packingUrl}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="text-sm text-red-600 text-center">{error}</div>}

      {/* Submit Button */}
      <div className="text-center">
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className={`px-10 py-4 rounded-2xl shadow-lg transition text-lg font-semibold ${
            submitting || !canSubmit
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Shipping Help"}
        </button>
      </div>
    </form>
  );
}
  