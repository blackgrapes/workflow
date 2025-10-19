// src/app/leads/[id]/FullDetails.tsx
"use client";

import React, { ReactNode } from "react";
import type { Lead } from "@/types/leads";
import { User, Package, Truck, DollarSign, FileText, Image as ImageIcon } from "lucide-react";

interface FullDetailsProps {
  lead: Lead | null;
}

export default function FullDetails({ lead }: FullDetailsProps): ReactNode{
  if (!lead) {
    return (
      <div className="text-sm text-gray-500">No lead details available.</div>
    );
  }

  const smallLabel = "text-xs text-gray-400";
  const valueClass = "text-sm font-medium text-gray-800";

  return (
    <div className="mt-8 space-y-6">
      {/* Summary */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center border">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className={smallLabel}>Lead ID</div>
            <div className="font-mono text-sm text-gray-900">{lead.leadId}</div>
          </div>
        </div>

        <div className="flex gap-6">
          <div>
            <div className={smallLabel}>Created</div>
            <div className={valueClass}>{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "—"}</div>
          </div>

          <div>
            <div className={smallLabel}>Status</div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
              <span className="text-sm text-gray-800">{lead.currentStatus ?? "—"}</span>
            </div>
          </div>

          <div>
            <div className={smallLabel}>Assigned</div>
            <div className={valueClass}>{lead.currentAssignedEmployee?.employeeName ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Grid: Customer / Sourcing / Shipping / Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Service */}
        {lead.customerService && (
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <header className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-md bg-indigo-50 border border-indigo-100">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold">Customer Service</h3>
            </header>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className={smallLabel}>Customer</div>
                <div className={valueClass}>{lead.customerService.customerName ?? "—"}</div>
              </div>

              <div className="flex gap-4">
                <div>
                  <div className={smallLabel}>Contact</div>
                  <div className={valueClass}>{lead.customerService.contactNumber ?? "—"}</div>
                </div>

                <div>
                  <div className={smallLabel}>Location</div>
                  <div className={valueClass}>
                    {lead.customerService.city ?? "—"}
                    {lead.customerService.state ? `, ${lead.customerService.state}` : ""}
                  </div>
                </div>
              </div>

              <div>
                <div className={smallLabel}>Address</div>
                <div className="text-sm text-gray-700">{lead.customerService.address ?? "—"}</div>
              </div>

              <div>
                <div className={smallLabel}>Products</div>
                {lead.customerService.products && lead.customerService.products.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {lead.customerService.products.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-md border"
                      >
                        <div>
                          <div className="font-medium text-gray-800">{p.productName}</div>
                          <div className="text-xs text-gray-500">Usage: {p.usage ?? "—"} • Size: {p.size ?? "—"}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-700">Qty: <span className="font-semibold">{p.quantity ?? "—"}</span></div>
                          <div className="text-xs text-gray-500 mt-1">Target: {p.targetPrice ?? "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mt-2">No products</div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Sourcing */}
        {lead.sourcing && (
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <header className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-md bg-amber-50 border border-amber-100">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">Sourcing</h3>
            </header>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className={smallLabel}>Product</div>
                <div className={valueClass}>{lead.sourcing.productName ?? "—"}</div>
              </div>

              <div className="flex gap-4">
                <div>
                  <div className={smallLabel}>Company</div>
                  <div className={valueClass}>{lead.sourcing.companyName ?? "—"}</div>
                </div>

                <div>
                  <div className={smallLabel}>Supplier</div>
                  <div className={valueClass}>{lead.sourcing.supplierName ?? "—"}</div>
                </div>
              </div>

              <div>
                <div className={smallLabel}>Supplier Contact</div>
                <div className={valueClass}>{lead.sourcing.supplierContactNumber ?? "—"}</div>
              </div>

              <div className="flex gap-4">
                <div>
                  <div className={smallLabel}>Unit Price</div>
                  <div className={valueClass}>{lead.sourcing.productUnitPrice ?? "—"}</div>
                </div>

                <div>
                  <div className={smallLabel}>Catalogue</div>
                  {lead.sourcing.productCatalogue ? (
                    <a
                      href={lead.sourcing.productCatalogue}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm hover:bg-slate-50"
                    >
                      <FileText className="w-4 h-4" />
                      Open catalogue
                    </a>
                  ) : (
                    <div className="text-sm text-gray-500">No catalogue</div>
                  )}
                </div>
              </div>

              <div>
                <div className={smallLabel}>Product detail</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{lead.sourcing.productDetail ?? "—"}</div>
              </div>

              <div>
                <div className={smallLabel}>Documents</div>
                {lead.sourcing.uploadDocuments && lead.sourcing.uploadDocuments.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lead.sourcing.uploadDocuments.map((d, idx) => (
                      <a
                        key={idx}
                        href={d}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border rounded-md text-sm hover:bg-slate-100"
                      >
                        <FileText className="w-4 h-4" />
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
        {lead.shipping && (
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <header className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-md bg-cyan-50 border border-cyan-100">
                <Truck className="w-5 h-5 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold">Shipping</h3>
            </header>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className={smallLabel}>Item name</div>
                <div className={valueClass}>{lead.shipping.itemName ?? "—"}</div>
              </div>

              <div className="flex gap-4">
                <div>
                  <div className={smallLabel}>Totals</div>
                  <div className="text-sm text-gray-700">
                    CTN: <span className="font-semibold">{lead.shipping.totalCTN ?? 0}</span> •
                    KG: <span className="font-semibold ml-1">{lead.shipping.totalKG ?? 0}</span> •
                    PCS: <span className="font-semibold ml-1">{lead.shipping.totalPCS ?? 0}</span>
                  </div>
                </div>

                <div>
                  <div className={smallLabel}>CBM / Value</div>
                  <div className="text-sm text-gray-700">
                    CBM: <span className="font-semibold">{lead.shipping.totalCBM ?? 0}</span> •
                    Value: <span className="font-semibold ml-1">{lead.shipping.totalValue ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div>
                  <div className={smallLabel}>HSN / Mode</div>
                  <div className={valueClass}>{lead.shipping.hsnCode ?? "—"} • {lead.shipping.shipmentMode ?? "—"}</div>
                </div>

                <div>
                  <div className={smallLabel}>Freight Rate</div>
                  <div className={valueClass}>{lead.shipping.freightRate ?? "—"}</div>
                </div>
              </div>

              <div>
                <div className={smallLabel}>Documents</div>
                <div className="mt-2 flex gap-2 items-center">
                  {lead.shipping.uploadInvoice ? (
                    <a
                      href={lead.shipping.uploadInvoice}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border rounded-md text-sm hover:bg-slate-100"
                    >
                      <FileText className="w-4 h-4" />
                      Invoice
                    </a>
                  ) : null}

                  {lead.shipping.uploadPackingList ? (
                    <a
                      href={lead.shipping.uploadPackingList}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border rounded-md text-sm hover:bg-slate-100"
                    >
                      <FileText className="w-4 h-4" />
                      Packing List
                    </a>
                  ) : null}

                  {!lead.shipping.uploadInvoice && !lead.shipping.uploadPackingList && (
                    <div className="text-sm text-gray-500">No docs</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sales */}
        {lead.sales && (
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <header className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-md bg-emerald-50 border border-emerald-100">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold">Sales</h3>
            </header>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className={smallLabel}>Tracking Number</div>
                <div className={valueClass}>{lead.sales.trackingNumber ?? "—"}</div>
              </div>

              <div>
                <div className={smallLabel}>Warehouse Receipt</div>
                <div className={valueClass}>{lead.sales.warehouseReceipt ?? "—"}</div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Uploaded Files */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <header className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-violet-50 border border-violet-100">
            <ImageIcon className="w-5 h-5 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold">Uploaded Media</h3>
        </header>

        {lead.uploadFiles && lead.uploadFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {lead.uploadFiles.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg overflow-hidden border hover:scale-105 transform transition"
              >
                <img
                  alt={`upload-${idx}`}
                  src={url}
                  className="w-full h-28 object-cover bg-slate-100"
                />
              </a>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No uploaded media.</div>
        )}
      </section>
    </div>
  );
}
