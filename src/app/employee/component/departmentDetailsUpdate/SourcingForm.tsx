// src/app/leads/[id]/SourcingForm.tsx
"use client";

import { useState, useEffect, ChangeEvent, ReactNode } from "react";
import type { Lead, Sourcing } from "@/types/leads";
import {
  User,
  MapPin,
  Phone,
  FileText,
  UploadCloud,
  DollarSign,
  Trash2,
  X,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";

interface SourcingFormProps {
  employeeId: string;
  employeeName: string;
  employeeMongoId: string;
  inquiryData?: Lead["sourcing"];
  uploading: boolean;
  onFileUpload: (files: FileList) => Promise<string[]>;
  onSubmit: (formData: Sourcing) => Promise<void>;
}

export default function SourcingForm({
  employeeId,
  employeeName,
  employeeMongoId,
  inquiryData,
  uploading,
  onFileUpload,
  onSubmit,
}: SourcingFormProps): ReactNode {
  const emptyInitial: Sourcing = {
    companyName: "",
    companyAddress: "",
    supplierName: "",
    supplierContactNumber: "",
    productDetail: "",
    productCatalogue: "",
    productUnitPrice: 0,
    uploadDocuments: [],
    logs: [],
  };

  const [formData, setFormData] = useState<Sourcing>(inquiryData ? ({ ...emptyInitial, ...inquiryData } as Sourcing) : emptyInitial);

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({
    productCatalogue: inquiryData?.productCatalogue ? [inquiryData.productCatalogue] : [],
    quotation: [],
    performaInvoice: [],
    packingList: [],
    others: inquiryData?.uploadDocuments || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    if (inquiryData) {
      setFormData((prev) => ({ ...prev, ...inquiryData }));
      setUploadedFiles((prev) => ({
        ...prev,
        productCatalogue: inquiryData.productCatalogue ? [inquiryData.productCatalogue] : prev.productCatalogue,
        others: inquiryData.uploadDocuments || prev.others,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryData]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.companyName?.trim()) e.companyName = "Company name is required";
    if (!formData.supplierName?.trim()) e.supplierName = "Supplier name is required";
    if (!formData.productDetail?.trim()) e.productDetail = "Product detail is required";
    if (!formData.supplierContactNumber?.trim()) e.supplierContactNumber = "Contact number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "productUnitPrice" ? (value === "" ? 0 : Number(value)) : value,
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      if (copy[name]) delete copy[name];
      return copy;
    });
  };

  const fileNameFromUrl = (url: string) => {
    try {
      return decodeURIComponent(url.split("/").pop() || url);
    } catch {
      return url;
    }
  };

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const category = (target.name || "others") as keyof typeof uploadedFiles;
    if (!target.files || target.files.length === 0) return;

    try {
      setBusy(true);
      const urls = await onFileUpload(target.files);
      setUploadedFiles((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), ...urls],
      }));

      setFormData((prev) => ({
        ...prev,
        uploadDocuments: [...(prev.uploadDocuments || []), ...urls],
        productCatalogue: category === "productCatalogue" ? (urls[0] || prev.productCatalogue) : prev.productCatalogue,
      }));
      // reset file input
      target.value = "";
    } catch (err) {
      console.error("upload error", err);
      alert("File upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const removeUploaded = (category: string, index: number) => {
    setUploadedFiles((prev) => {
      const copy: Record<string, string[]> = { ...prev };
      const removed = copy[category].splice(index, 1); // mutates copy[category]
      copy[category] = [...copy[category]];
      setFormData((fd) => ({
        ...fd,
        uploadDocuments: (fd.uploadDocuments || []).filter((u) => u !== removed[0]),
        productCatalogue:
          category === "productCatalogue" && fd.productCatalogue === removed[0] ? "" : fd.productCatalogue,
      }));
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setBusy(true);
      // attach employee info if API expects those fields
      const payload: Sourcing = {
        ...formData,
        employeeId,
        managerId: employeeMongoId,
        logs: formData.logs || [],
      } as Sourcing;
      await onSubmit(payload);
    } catch (err) {
      console.error(err);
      alert("Submit failed.");
    } finally {
      setBusy(false);
    }
  };

  const fileCategories = [
    { key: "productCatalogue", label: "Catalogue", accept: "image/*,.pdf,.doc,.docx" },
    { key: "quotation", label: "Quotation", accept: "image/*,.pdf" },
    { key: "performaInvoice", label: "Performa Invoice", accept: "image/*,.pdf" },
    { key: "packingList", label: "Packing List", accept: "image/*,.pdf" },
    { key: "others", label: "Other Documents", accept: "image/*,.pdf,.doc,.docx" },
  ] as const;

  return (
    <div className="w-full bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-lg border border-slate-100">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{inquiryData ? "Update Sourcing" : "New Sourcing"}</h2>
          <p className="text-sm text-gray-500">Assigned to <strong className="text-slate-700">{employeeName}</strong></p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {formData.productCatalogue ? (
            <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
              Catalogue
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 bg-slate-50 text-slate-700 px-3 py-1 rounded-full text-sm border border-slate-100">
              <UploadCloud className="w-4 h-4" />
              Uploads
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              name="companyName"
              value={formData.companyName ?? ""}
              onChange={handleChange}
              className="pl-11 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Supplier company name"
            />
          </div>
          {errors.companyName && <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>}
        </div>

        {/* Company Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              name="companyAddress"
              value={formData.companyAddress ?? ""}
              onChange={handleChange}
              className="pl-11 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Full address"
            />
          </div>
        </div>

        {/* Supplier Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <User className="w-4 h-4" />
            </div>
            <input
              name="supplierName"
              value={formData.supplierName ?? ""}
              onChange={handleChange}
              className="pl-11 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Contact person"
            />
          </div>
          {errors.supplierName && <p className="text-red-600 text-sm mt-1">{errors.supplierName}</p>}
        </div>

        {/* Supplier Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              name="supplierContactNumber"
              value={formData.supplierContactNumber ?? ""}
              onChange={handleChange}
              className="pl-11 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="+86 10 1234 5678"
            />
          </div>
          {errors.supplierContactNumber && <p className="text-red-600 text-sm mt-1">{errors.supplierContactNumber}</p>}
        </div>
      </div>

      {/* Product Detail */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Detail</label>
        <textarea
          name="productDetail"
          value={formData.productDetail ?? ""}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 h-32 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Describe product specs, MOQ, lead time, packaging, etc."
        />
        {errors.productDetail && <p className="text-red-600 text-sm mt-1">{errors.productDetail}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
        {/* Unit Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (RMB)</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              id="productUnitPrice"
              name="productUnitPrice"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={formData.productUnitPrice ?? 0}
              onChange={handleChange}
              className="pl-11 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Product Catalogue (single) */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Catalogue</label>
          <div className="flex items-center gap-2">
            <label htmlFor="productCatalogue" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer hover:bg-slate-50 text-sm">
              <FileText className="w-4 h-4 text-slate-700" />
              Choose file
            </label>
            <input id="productCatalogue" name="productCatalogue" type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFiles} className="hidden" />
            <div className="text-xs text-gray-500">{formData.productCatalogue ? fileNameFromUrl(formData.productCatalogue) : "No file"}</div>
          </div>
          <UploadedFilesList category="productCatalogue" />
        </div>

        {/* Other Files (multi) */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Other Documents</label>
          <div className="flex items-center gap-2">
            <label htmlFor="others" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer hover:bg-slate-50 text-sm">
              <UploadCloud className="w-4 h-4 text-slate-700" />
              Add
            </label>
            <input id="others" name="others" type="file" accept="image/*,.pdf,.doc,.docx" multiple onChange={handleFiles} className="hidden" />
            <div className="text-xs text-gray-500">{(uploadedFiles.others || []).length} file(s)</div>
          </div>
          <UploadedFilesList category="others" />
        </div>
      </div>

      {/* Additional file categories expanded below for clarity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {fileCategories
          .filter((c) => c.key !== "productCatalogue" && c.key !== "others")
          .map((cat) => (
            <div key={cat.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{cat.label}</label>
              <div className="flex items-center gap-2">
                <label htmlFor={cat.key} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer hover:bg-slate-50 text-sm">
                  <FileText className="w-4 h-4 text-slate-700" />
                  Upload
                </label>
                <input id={cat.key} name={cat.key} type="file" accept={cat.accept} multiple onChange={handleFiles} className="hidden" />
                <div className="text-xs text-gray-500">{(uploadedFiles[cat.key] || []).length} file(s)</div>
              </div>
              <UploadedFilesList category={cat.key} />
            </div>
          ))}
      </div>

      {/* actions */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          <span className="inline-flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-500" />
            Files uploaded: <strong className="text-slate-800">{(formData.uploadDocuments || []).length}</strong>
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={uploading || busy}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium ${
              uploading || busy ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {inquiryData ? "Update Sourcing" : "Submit Sourcing"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (inquiryData) {
                setFormData({ ...(inquiryData as Sourcing) });
                setUploadedFiles({
                  productCatalogue: inquiryData.productCatalogue ? [inquiryData.productCatalogue] : [],
                  quotation: [],
                  performaInvoice: [],
                  packingList: [],
                  others: inquiryData.uploadDocuments || [],
                });
              } else {
                setFormData({ ...emptyInitial });
                setUploadedFiles({
                  productCatalogue: [],
                  quotation: [],
                  performaInvoice: [],
                  packingList: [],
                  others: [],
                });
              }
              setErrors({});
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );

  // inner component defined after return to allow usage in JSX above
  function UploadedFilesList({ category }: { category: string }) {
    const list = uploadedFiles[category] || [];
    return (
      <div className="mt-2">
        <p className="text-xs text-gray-500">{list.length} file(s)</p>
        <ul className="mt-2 space-y-2">
          {list.map((u, i) => (
            <li key={u + i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/\.(png|jpg|jpeg|gif|webp)$/i.test(u.split("?")[0]) ? (
                  <img src={u} alt={fileNameFromUrl(u)} className="w-12 h-8 object-cover rounded-sm border" />
                ) : (
                  <div className="w-12 h-8 flex items-center justify-center rounded-sm border text-xs text-gray-600">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <a href={u} target="_blank" rel="noreferrer" className="truncate text-sm text-slate-800">
                  {fileNameFromUrl(u)}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => removeUploaded(category, i)}
                  className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md hover:bg-red-50 text-red-600 border border-red-100"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
