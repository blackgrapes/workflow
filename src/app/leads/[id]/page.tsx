// src/app/leads/[id]/page.tsx
"use client";

import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Lead } from "@/types/leads";
import { getLeadById } from "@/lib/frontendApis/employees/apis";
import LoadingSkeleton from "@/app/component/loading/loading";

/**
 * Lead detail page — fully typed (no `any`), strict-mode friendly.
 *
 * Features:
 * - Shows full UI for the entire Lead schema you provided (CustomerService, Sourcing, Shipping, Sales).
 * - Top filter dropdown to show only one section (Customer Service / Sourcing / Shipping / Sales) or "All".
 * - Clean, responsive Tailwind UI — single file, no extra files.
 * - No `any` used anywhere.
 */

type SectionKey = "all" | "customerService" | "sourcing" | "shipping" | "sales";

export default function LeadDetailPage(): ReactNode{
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) ?? "";

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionKey>("all");

  useEffect(() => {
    if (!id) {
      setError("Invalid lead id.");
      setLoading(false);
      return;
    }

    const fetchLead = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const data = await getLeadById(id);
        if (!data) {
          setError("Lead not found");
          setLead(null);
        } else {
          setLead(data);
        }
      } catch (err: unknown) {
        // clear previous lead on error
        setLead(null);
        // safe error extraction without `any`
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  const showSection = useMemo(
    () => (section: SectionKey) => {
      if (selectedSection === "all") return true;
      return selectedSection === section;
    },
    [selectedSection]
  );

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <div className="mt-4 flex gap-2">
          <button
            className="px-3 py-2 border rounded bg-white hover:bg-gray-50"
            onClick={() => router.back()}
            type="button"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Lead not found.</div>
        <button
          className="mt-4 px-3 py-2 border rounded"
          onClick={() => router.back()}
          type="button"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-lg">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">
              Lead ID: <span className="font-mono">{lead.leadId}</span>
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">
              {lead.customerService?.customerName ?? "—"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {lead.customerService?.contactNumber ?? "—"} • {lead.customerService?.city ?? "—"}
              {lead.customerService?.state ? `, ${lead.customerService.state}` : ""}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Status: <span className="font-medium">{lead.currentStatus ?? "—"}</span>
              {" • "}
              Assigned: <span className="font-medium">{lead.currentAssignedEmployee?.employeeName ?? "—"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label htmlFor="section" className="text-xs text-gray-500 block mb-1">
                View section
              </label>
              <select
                id="section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value as SectionKey)}
                className="px-3 py-2 border rounded-md bg-white text-sm"
              >
                <option value="all">All</option>
                <option value="customerService">Customer Service</option>
                <option value="sourcing">Sourcing</option>
                <option value="shipping">Shipping</option>
                <option value="sales">Sales</option>
              </select>
            </div>

            <button
              onClick={() => router.back()}
              className="px-3 py-2 rounded-md border hover:bg-gray-50"
              type="button"
            >
              Back
            </button>
          </div>
        </div>

        <hr className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: quick data & uploads */}
          <aside className="md:col-span-1 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Meta</h3>
              <div className="text-sm text-gray-600">
                <div>
                  Created:{" "}
                  <span className="font-medium">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "—"}
                  </span>
                </div>
                <div className="mt-1">Updated: <span className="font-medium">{lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : "—"}</span></div>
                <div className="mt-1">Marka: <span className="font-medium">{lead.customerService?.marka ?? lead.shipping?.marka ?? "—"}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Files</h3>

              {lead.uploadFiles && lead.uploadFiles.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {lead.uploadFiles.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded overflow-hidden border"
                      title="Open file in new tab"
                    >
                      <img alt={`upload-${idx}`} src={url} className="w-full h-20 object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No uploaded media.</div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Logs</h3>
              {lead.logs && lead.logs.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-auto">
                  {lead.logs.map((log, i) => (
                    <div key={i} className="text-xs text-gray-700 bg-white p-2 rounded border">
                      <div className="font-medium">{log.employeeName}</div>
                      <div className="text-gray-500 text-[11px]">{log.comment}</div>
                      <div className="text-gray-400 text-[11px] mt-1">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No logs available.</div>
              )}
            </div>
          </aside>

          {/* Main column: sections */}
          <main className="md:col-span-2 space-y-6">
            {/* Customer Service */}
            {lead.customerService && showSection("customerService") && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Customer Service</h2>
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Customer</div>
                      <div className="font-medium text-gray-800">{lead.customerService.customerName ?? "—"}</div>

                      <div className="mt-3 text-sm text-gray-500">Contact</div>
                      <div className="font-medium">{lead.customerService.contactNumber ?? "—"}</div>

                      <div className="mt-3 text-sm text-gray-500">Address</div>
                      <div className="text-sm">{lead.customerService.address ?? "—"}</div>

                      <div className="mt-3 text-sm text-gray-500">City / State</div>
                      <div className="font-medium">{lead.customerService.city ?? "—"}{lead.customerService.state ? `, ${lead.customerService.state}` : ""}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Employee ID</div>
                      <div className="font-medium">{String(lead.customerService.employeeId ?? "—")}</div>

                      <div className="mt-3 text-sm text-gray-500">Manager ID</div>
                      <div className="font-medium">{String(lead.customerService.managerId ?? "—")}</div>

                      <div className="mt-3 text-sm text-gray-500">Products</div>

                      {lead.customerService.products && lead.customerService.products.length > 0 ? (
                        <div className="space-y-3 mt-2">
                          {lead.customerService.products.map((p, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-4 bg-gray-50 p-3 rounded-md border">
                              <div>
                                <div className="font-medium text-gray-800">{p.productName}</div>
                                <div className="text-sm text-gray-600">Usage: {p.usage ?? "—"}</div>
                                <div className="text-sm text-gray-600">Size: {p.size ?? "—"}</div>
                                <div className="text-sm text-gray-600 mt-1">Files:</div>
                                <div className="flex gap-2 mt-1">
                                  {p.uploadFiles && p.uploadFiles.length > 0 ? (
                                    p.uploadFiles.map((u, i2) => (
                                      <a key={i2} href={u} target="_blank" rel="noreferrer" className="block w-16 h-12 overflow-hidden rounded border">
                                        <img alt={`prod-${idx}-${i2}`} src={u} className="w-full h-full object-cover" />
                                      </a>
                                    ))
                                  ) : (
                                    <div className="text-sm text-gray-400">No product files</div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div>Qty: <span className="font-medium">{p.quantity}</span></div>
                                <div className="mt-1">Target: <span className="font-medium">{p.targetPrice ?? "—"}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 mt-2">No products added</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Sourcing */}
            {lead.sourcing && showSection("sourcing") && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Sourcing</h2>
                <div className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Product</div>
                      <div className="font-medium">{lead.sourcing.productName ?? "—"}</div>

                      <div className="mt-3 text-sm text-gray-500">Company</div>
                      <div className="font-medium">{lead.sourcing.companyName ?? "—"}</div>

                      <div className="mt-3 text-sm text-gray-500">Company Address</div>
                      <div className="text-sm">{lead.sourcing.companyAddress ?? "—"}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Supplier</div>
                      <div className="font-medium">{lead.sourcing.supplierName ?? "—"}</div>

                      <div className="mt-3 text-sm text-gray-500">Supplier Contact</div>
                      <div className="font-medium">{lead.sourcing.supplierContactNumber ?? "—"}</div>

                      <div className="mt-3 text-sm text-gray-500">Unit price</div>
                      <div className="font-medium">{lead.sourcing.productUnitPrice ?? "—"}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Product detail</div>
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{lead.sourcing.productDetail ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Product catalogue</div>
                    {lead.sourcing.productCatalogue ? (
                      <a
                        href={lead.sourcing.productCatalogue}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 px-3 py-2 border rounded text-sm hover:bg-gray-50"
                      >
                        Open catalogue
                      </a>
                    ) : (
                      <div className="text-sm text-gray-500 mt-2">No catalogue uploaded</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Upload documents</div>
                    {lead.sourcing.uploadDocuments && lead.sourcing.uploadDocuments.length > 0 ? (
                      <div className="flex gap-3 mt-2">
                        {lead.sourcing.uploadDocuments.map((d, idx) => (
                          <a
                            key={idx}
                            href={d}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 border rounded text-sm"
                            title="Open document"
                          >
                            Document {idx + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mt-2">No documents</div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Shipping */}
            {lead.shipping && showSection("shipping") && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Shipping</h2>
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Item name</div>
                      <div className="font-medium">{lead.shipping.itemName ?? "—"}</div>

                      <div className="mt-3 text-sm text-gray-500">Totals</div>
                      <div className="text-sm">
                        CTN: {lead.shipping.totalCTN ?? 0} • KG: {lead.shipping.totalKG ?? 0} • PCS: {lead.shipping.totalPCS ?? 0}
                      </div>

                      <div className="mt-3 text-sm text-gray-500">CBM / Value</div>
                      <div className="text-sm">
                        CBM: {lead.shipping.totalCBM ?? 0} • Value: {lead.shipping.totalValue ?? 0}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">HSN / Mode</div>
                      <div className="font-medium">{lead.shipping.hsnCode ?? "—"} • {lead.shipping.shipmentMode ?? "—"}</div>

                      <div className="mt-3 text-sm text-gray-500">Upload Invoice / Packing list</div>
                      <div className="flex gap-2 mt-2">
                        {lead.shipping.uploadInvoice ? (
                          <a href={lead.shipping.uploadInvoice} target="_blank" rel="noreferrer" className="px-3 py-2 border rounded text-sm">
                            Invoice
                          </a>
                        ) : null}
                        {lead.shipping.uploadPackingList ? (
                          <a href={lead.shipping.uploadPackingList} target="_blank" rel="noreferrer" className="px-3 py-2 border rounded text-sm">
                            Packing List
                          </a>
                        ) : null}
                        {!lead.shipping.uploadInvoice && !lead.shipping.uploadPackingList && <div className="text-sm text-gray-500">No docs</div>}
                      </div>

                      <div className="mt-3 text-sm text-gray-500">Freight Rate</div>
                      <div className="font-medium">{lead.shipping.freightRate ?? "—"}</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Sales */}
            {lead.sales && showSection("sales") && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Sales</h2>
                <div className="bg-white border rounded-lg p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Tracking Number</div>
                    <div className="font-medium">{lead.sales.trackingNumber ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Warehouse Receipt</div>
                    <div className="font-medium">{lead.sales.warehouseReceipt ?? "—"}</div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
