"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Lead, Sourcing } from "@/types/leads";

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
}: SourcingFormProps) {
  const [formData, setFormData] = useState<Sourcing>({
    companyName: "",
    companyAddress: "",
    supplierName: "",
    supplierContactNumber: "",
    productDetail: "",
    productCatalogue: "",
    productUnitPrice: 0,
    uploadDocuments: [],
    logs: [],
  });

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({
    productCatalogue: inquiryData?.productCatalogue
      ? [inquiryData.productCatalogue]
      : [],
    quotation: [],
    performaInvoice: [],
    packingList: [],
    others: inquiryData?.uploadDocuments || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (inquiryData) {
      setFormData((prev) => ({ ...prev, ...inquiryData }));
      setUploadedFiles((prev) => ({
        ...prev,
        productCatalogue: inquiryData.productCatalogue
          ? [inquiryData.productCatalogue]
          : prev.productCatalogue,
        others: inquiryData.uploadDocuments || prev.others,
      }));
    }
  }, [inquiryData]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!formData.companyName?.trim())
      err.companyName = "Company name is required";
    if (!formData.supplierName?.trim())
      err.supplierName = "Supplier name is required";
    if (!formData.productDetail?.trim())
      err.productDetail = "Product detail is required";
    if (!formData.supplierContactNumber?.trim())
      err.supplierContactNumber = "Contact number is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "productUnitPrice" ? Number(value) : value,
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      if (copy[name]) delete copy[name];
      return copy;
    });
  };

  const fileNameFromUrl = (url: string) =>
    decodeURI(url.split("/").pop() || url);

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const category = (target.name || "others") as keyof typeof uploadedFiles;
    if (!target.files || target.files.length === 0) return;

    try {
      const urls = await onFileUpload(target.files);
      setUploadedFiles((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), ...urls],
      }));
      setFormData((prev) => ({
        ...prev,
        uploadDocuments: [...(prev.uploadDocuments || []), ...urls],
        productCatalogue:
          category === "productCatalogue"
            ? urls[0] || prev.productCatalogue
            : prev.productCatalogue,
      }));
      target.value = "";
    } catch (err) {
      console.error(err);
      alert("File upload failed.");
    }
  };

  const removeUploaded = (category: string, index: number) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev };
      const removed = copy[category].splice(index, 1);
      copy[category] = [...copy[category]];
      setFormData((fd) => ({
        ...fd,
        uploadDocuments: (fd.uploadDocuments || []).filter(
          (u) => u !== removed[0]
        ),
        productCatalogue:
          category === "productCatalogue" && fd.productCatalogue === removed[0]
            ? ""
            : fd.productCatalogue,
      }));
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await onSubmit({
        ...formData,
        employeeId,
        managerId: employeeMongoId,
        logs: formData.logs || [],
      });
    } catch (err) {
      console.error(err);
      alert("Submit failed.");
    }
  };

  const FileList = ({ category }: { category: string }) => {
    const list = uploadedFiles[category] || [];
    return (
      <div className="mt-2">
        <p className="text-xs text-gray-500">{list.length} file(s)</p>
        <ul className="mt-1 space-y-2 text-sm">
          {list.map((u, i) => (
            <li key={u + i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full">
                {/(\.png|\.jpg|\.jpeg|\.gif|\.webp)(\?.*)?$/.test(
                  u.toLowerCase()
                ) ? (
                  <img
                    src={u}
                    alt={fileNameFromUrl(u)}
                    className="w-12 h-8 object-cover rounded-sm border"
                  />
                ) : (
                  <div className="w-12 h-8 flex items-center justify-center rounded-sm border text-xs text-gray-600">
                    PDF
                  </div>
                )}
                <a
                  href={u}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm"
                >
                  {fileNameFromUrl(u)}
                </a>
              </div>
              <button
                type="button"
                onClick={() => removeUploaded(category, i)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const fileCategories = [
    {
      key: "productCatalogue",
      label: "Catalogue",
      accept: "image/*,.pdf,.doc,.docx",
    },
    { key: "quotation", label: "Quotation", accept: "image/*,.pdf" },
    {
      key: "performaInvoice",
      label: "Performa Invoice",
      accept: "image/*,.pdf",
    },
    { key: "packingList", label: "Packing List", accept: "image/*,.pdf" },
    {
      key: "others",
      label: "Other Documents",
      accept: "image/*,.pdf,.doc,.docx",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        {inquiryData ? "Update Sourcing" : "New Sourcing Form"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Company Name", name: "companyName", type: "text" },
          { label: "Company Address", name: "companyAddress", type: "text" },
          { label: "Supplier Name", name: "supplierName", type: "text" },
          {
            label: "Contact Number",
            name: "supplierContactNumber",
            type: "tel",
          },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              name={field.name}
              type={field.type}
              value={formData[field.name as keyof Sourcing] as string}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder={field.label}
            />
            {errors[field.name] && (
              <p className="text-red-600 text-sm mt-1">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Detail
        </label>
        <textarea
          name="productDetail"
          value={formData.productDetail}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 h-28 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Product description, specs, MOQ..."
        />
        {errors.productDetail && (
          <p className="text-red-600 text-sm mt-1">{errors.productDetail}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label
            htmlFor="productUnitPrice"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Unit Price (RMB)
          </label>
          <input
            id="productUnitPrice"
            name="productUnitPrice"
            type="number"
            min={0}
            step={0.01}
            placeholder="Enter unit price in RMB"
            value={formData.productUnitPrice ?? ""}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {fileCategories.map((cat) => (
          <div key={cat.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {cat.label}
            </label>
            <div className="flex items-center gap-2">
              <label
                htmlFor={cat.key}
                className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm"
              >
                <span>Choose files</span>
              </label>
              <input
                id={cat.key}
                name={cat.key}
                type="file"
                multiple
                accept={cat.accept}
                onChange={handleFiles}
                className="hidden"
              />
              <span className="text-xs text-gray-500">
                {cat.accept.replace(/,/g, "/")}
              </span>
            </div>
            <FileList category={cat.key} />
          </div>
        ))}
      </div>

      {uploading && (
        <p className="text-sm text-blue-600 mt-3">Uploading files...</p>
      )}

      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          Assigned to: <strong>{employeeName}</strong>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className={`px-4 py-2 rounded-md font-medium text-white ${
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {inquiryData ? "Update Sourcing" : "Submit Sourcing"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (inquiryData) setFormData({ ...(inquiryData as Sourcing) });
              else
                setFormData({
                  companyName: "",
                  companyAddress: "",
                  supplierName: "",
                  supplierContactNumber: "",
                  productDetail: "",
                  productCatalogue: "",
                  productUnitPrice: 0,
                  uploadDocuments: [],
                  logs: [],
                });
              setUploadedFiles({
                productCatalogue: inquiryData?.productCatalogue
                  ? [inquiryData.productCatalogue]
                  : [],
                quotation: [],
                performaInvoice: [],
                packingList: [],
                others: inquiryData?.uploadDocuments || [],
              });
              setErrors({});
            }}
            className="px-4 py-2 rounded-md font-medium border border-gray-300"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
