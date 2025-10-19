// src/app/leads/[id]/page.tsx
"use client";

import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Lead } from "@/types/leads";
import { getLeadById } from "@/lib/frontendApis/employees/apis";
import LoadingSkeleton from "@/app/component/loading/loading";

/*
  Updates requested & applied:
  - Applied the same translucent + blur header effect to all cards on the page.
  - Replaced inline SVG icons with simple emoji-based icons (no external deps).
  - Kept no `any` usage and preserved TypeScript typing.
  - Returned full file for direct paste into your editor.
*/

type SectionKey = "all" | "customerService" | "sourcing" | "shipping" | "sales";

function normalizeResponseToLead(resp: unknown): Lead | null {
  if (!resp || typeof resp !== "object") return null;
  const obj = resp as Record<string, unknown>;

  if ("success" in obj && "data" in obj && obj.data && typeof obj.data === "object") {
    return obj.data as Lead;
  }
  if ("data" in obj && obj.data && typeof obj.data === "object") {
    return obj.data as Lead;
  }
  if ("lead" in obj && obj.lead && typeof obj.lead === "object") {
    return obj.lead as Lead;
  }
  if ("leadId" in obj || "_id" in obj || "customerService" in obj) {
    return obj as unknown as Lead;
  }
  return null;
}

/* Emoji-based icons to avoid any external dependency (keeps code simple & practical) */
const Icon = {
  Id: () => <span role="img" aria-label="id" className="text-sm">🆔</span>,
  Phone: () => <span role="img" aria-label="phone" className="text-sm">📞</span>,
  Location: () => <span role="img" aria-label="location" className="text-sm">📍</span>,
  Status: () => <span role="img" aria-label="status" className="text-sm">🏷️</span>,
  Calendar: () => <span role="img" aria-label="calendar" className="text-sm">📅</span>,
  Attachment: () => <span role="img" aria-label="attachment" className="text-sm">📎</span>,
  Clock: () => <span role="img" aria-label="clock" className="text-sm">🕒</span>,
  Back: () => <span role="img" aria-label="back" className="text-sm">◀️</span>,
  ChevronDown: () => <span role="img" aria-label="chevron-down" className="text-sm">▼</span>,
  External: () => <span role="img" aria-label="external" className="text-sm">↗️</span>,
  Person: () => <span role="img" aria-label="person" className="text-base">👤</span>,
  Factory: () => <span role="img" aria-label="factory" className="text-base">🏭</span>,
  Ship: () => <span role="img" aria-label="ship" className="text-base">🚢</span>,
  Briefcase: () => <span role="img" aria-label="briefcase" className="text-base">💼</span>,
  Image: () => <span role="img" aria-label="image" className="text-2xl">🖼️</span>
};

export default function LeadDetailPage(): ReactNode {
  const params = useParams() as { id?: string } | undefined;
  const router = useRouter();
  const id = String(params?.id ?? "").trim();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionKey>("all");
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    all: true,
    customerService: true,
    sourcing: true,
    shipping: true,
    sales: true
  });

  useEffect(() => {
    if (!id) {
      setError("Invalid lead id.");
      setLoading(false);
      setLead(null);
      return;
    }

    let cancelled = false;
    const fetchLead = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const resp = await getLeadById(id);
        const normalized = normalizeResponseToLead(resp);
        if (cancelled) return;
        if (!normalized) {
          setLead(null);
          setError("Lead not found or unexpected response shape.");
        } else {
          setLead(normalized);
        }
      } catch (err: unknown) {
        setLead(null);
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLead();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggle = (key: SectionKey) => {
    setExpanded((s) => ({ ...s, [key]: !s[key] }));
  };

  const sectionColor = (_key: SectionKey) => {
    // Return the translucent + blur base (header style) — individual wrappers add rounded/shadow/padding as before.
    return "bg-white/40 backdrop-blur-md border border-gray-100";
  };

  const showSection = useMemo(() => (section: SectionKey) => {
    if (selectedSection === "all") return true;
    return selectedSection === section;
  }, [selectedSection]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <div className="mt-4 flex gap-2">
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-white hover:bg-gray-50"
            onClick={() => router.back()}
            type="button"
          >
            <Icon.Back /> <span>Back</span>
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
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Top header card — translucent + blur so the mirror-like effect is visible */}
        <div className="sticky top-4 z-20">
          <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md px-2 py-1 bg-white border border-gray-100 text-xs font-medium inline-flex items-center gap-2">
                    <span className="text-sm"><Icon.Id /></span>
                    <span className="font-mono text-sm">{lead.leadId}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 flex items-center gap-3">
                    <span className="inline-flex items-center gap-2"><Icon.Phone /> <span>{lead.customerService?.contactNumber ?? "—"}</span></span>
                    <span className="inline-flex items-center gap-2">•</span>
                    <span className="inline-flex items-center gap-2"><Icon.Location /> <span>{lead.customerService?.city ?? "—"}{lead.customerService?.state ? `, ${lead.customerService.state}` : ""}</span></span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold mt-1">{lead.customerService?.customerName ?? "—"}</h2>
                  <div className="mt-1 text-sm text-gray-600 inline-flex items-center gap-6">
                    <span className="inline-flex items-center gap-2"><Icon.Status /> <span className="capitalize">{lead.currentStatus ?? "—"}</span></span>
                    <span className="inline-flex items-center gap-2">Assigned: <strong>{lead.currentAssignedEmployee?.employeeName ?? "—"}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* segmented control */}
                <div className="hidden sm:flex items-center gap-1 bg-transparent p-1 rounded-md border border-transparent">
                  {(["all","customerService","sourcing","shipping","sales"] as SectionKey[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSection(s)}
                      className={`px-3 py-1 text-sm rounded-md transition ${selectedSection === s ? "bg-white shadow-sm font-medium border border-gray-100" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      {s === "all" ? "All" : s === "customerService" ? "Customer" : s === "sourcing" ? "Sourcing" : s === "shipping" ? "Shipping" : "Sales"}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => router.back()} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50 bg-white">
                    <Icon.Back /> <span className="hidden sm:inline">Back</span>
                  </button>
                </div>
              </div>
            </div>

            {/* mobile select */}
            <div className="mt-3 sm:hidden">
              <select
                className="w-full rounded-md border px-3 py-2 bg-white text-sm"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value as SectionKey)}
              >
                <option value="all">All</option>
                <option value="customerService">Customer Service</option>
                <option value="sourcing">Sourcing</option>
                <option value="shipping">Shipping</option>
                <option value="sales">Sales</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          {/* Sidebar (meta + uploads + logs) */}
          <aside className="md:col-span-1 space-y-4">
            <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500"><Icon.Calendar /></span>
                  <h3 className="text-sm font-semibold">Meta</h3>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2"><span className="text-gray-400"><Icon.Calendar /></span> Created: <span className="ml-auto font-medium">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "—"}</span></div>
                <div className="flex items-center gap-2"><span className="text-gray-400"><Icon.Clock /></span> Updated: <span className="ml-auto font-medium">{lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : "—"}</span></div>
                <div className="flex items-center gap-2"><span className="text-gray-400"><Icon.Id /></span> Marka: <span className="ml-auto font-medium">{lead.customerService?.marka ?? lead.shipping?.marka ?? "—"}</span></div>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500"><Icon.Attachment /></span>
                <h3 className="text-sm font-semibold">Uploaded</h3>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {(lead.uploadFiles && lead.uploadFiles.length > 0) ? (
                  lead.uploadFiles.map((u, i) => (
                    <a key={String(i)} href={u} target="_blank" rel="noreferrer" className="rounded overflow-hidden border hover:scale-105 transition-transform block">
                      <img src={u} alt={`upload-${i}`} className="w-full h-20 object-cover" />
                    </a>
                  ))
                ) : (
                  <div className="text-sm text-gray-400 col-span-3">No uploads</div>
                )}
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500"><Icon.Clock /></span>
                <h3 className="text-sm font-semibold">Logs</h3>
              </div>

              <div className="mt-3 max-h-48 overflow-auto text-sm text-gray-700 space-y-3">
                {lead.logs && lead.logs.length > 0 ? (
                  <div className="relative pl-4">
                    <div className="absolute left-1 top-0 bottom-0 w-px bg-gray-200" />
                    <div className="space-y-4">
                      {lead.logs.map((l, idx) => (
                        <div key={String(idx)} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">{String(idx + 1)}</div>
                          <div>
                            <div className="text-xs text-gray-500">{l.employeeName} • <span className="text-gray-400">{l.timestamp ? new Date(l.timestamp).toLocaleString() : ""}</span></div>
                            <div className="text-sm text-gray-700">{l.comment}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No logs available</div>
                )}
              </div>
            </div>
          </aside>

          {/* Main content - spans 3 columns */}
          <div className="md:col-span-3 space-y-6">

            {/* Customer Service */}
            {lead.customerService && showSection("customerService") && (
              <div className={`${sectionColor("customerService")} rounded-2xl overflow-hidden shadow-sm`}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-md bg-white border border-gray-100 text-gray-700 inline-flex items-center"><Icon.Person /></div>
                    <div>
                      <div className="text-sm font-semibold">Customer Service</div>
                      <div className="text-xs text-gray-500">Customer & product details</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggle("customerService")} className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50">
                      <span className="text-sm">{expanded.customerService ? "Collapse" : "Expand"}</span>
                      <span className={`transform transition-transform ${expanded.customerService ? "rotate-180" : "rotate-0"}`}><Icon.ChevronDown /></span>
                    </button>
                  </div>
                </div>

                <div className={`p-4 transition-all ${expanded.customerService ? "max-h-screen opacity-100" : "max-h-0 opacity-0 p-0"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="text-sm text-gray-500 flex items-center gap-2">Customer <span className="ml-auto font-medium">{lead.customerService.customerName ?? "—"}</span></div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">Contact <span className="ml-auto font-medium">{lead.customerService.contactNumber ?? "—"}</span></div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">Address <span className="ml-auto text-sm">{lead.customerService.address ?? "—"}</span></div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">City <span className="ml-auto font-medium">{lead.customerService.city ?? "—"}{lead.customerService.state ? `, ${lead.customerService.state}` : ""}</span></div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm text-gray-500 flex items-center gap-2">Employee ID <span className="ml-auto font-medium">{String(lead.customerService.employeeId ?? "—")}</span></div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">Manager ID <span className="ml-auto font-medium">{String(lead.customerService.managerId ?? "—")}</span></div>

                      <div>
                        <div className="text-sm text-gray-500">Products</div>
                        {lead.customerService.products && lead.customerService.products.length > 0 ? (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {lead.customerService.products.map((p, idx) => (
                              <div key={String(idx)} className="flex gap-3 items-center border rounded-md p-3 bg-white">
                                <div className="w-16 h-12 rounded overflow-hidden border flex-shrink-0 flex items-center justify-center bg-gray-50">
                                  {p.uploadFiles && p.uploadFiles[0] ? (
                                    <img src={p.uploadFiles[0]} alt={p.productName ?? `product-${idx}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="text-gray-300"><Icon.Image /></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{p.productName}</div>
                                  <div className="text-xs text-gray-500">Qty: {p.quantity ?? "—"} • Size: {p.size ?? "—"}</div>
                                  <div className="mt-2 text-xs text-gray-600">Target: {p.targetPrice ?? "—"}</div>
                                </div>
                                <div>
                                  <a href={p.uploadFiles && p.uploadFiles[0] ? p.uploadFiles[0] : "#"} target="_blank" rel="noreferrer" className="text-xs inline-flex items-center gap-1 px-2 py-1 border rounded hover:bg-gray-50">
                                    View <Icon.External />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 mt-2">No products added</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sourcing */}
            {lead.sourcing && showSection("sourcing") && (
              <div className={`${sectionColor("sourcing")} rounded-2xl overflow-hidden shadow-sm`}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-md bg-white border border-gray-100 text-gray-700 inline-flex items-center"><Icon.Factory /></div>
                    <div>
                      <div className="text-sm font-semibold">Sourcing</div>
                      <div className="text-xs text-gray-500">Supplier & catalogue</div>
                    </div>
                  </div>
                  <div>
                    <button onClick={() => toggle("sourcing")} className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50">
                      <span className="text-sm">{expanded.sourcing ? "Collapse" : "Expand"}</span>
                      <span className={`transform transition-transform ${expanded.sourcing ? "rotate-180" : "rotate-0"}`}><Icon.ChevronDown /></span>
                    </button>
                  </div>
                </div>

                <div className={`p-4 transition-all ${expanded.sourcing ? "max-h-screen opacity-100" : "max-h-0 opacity-0 p-0"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="text-sm text-gray-500 flex items-center gap-2">Product <span className="ml-auto font-medium">{lead.sourcing.productName || "—"}</span></div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">Company <span className="ml-auto font-medium">{lead.sourcing.companyName ?? "—"}</span></div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">Company Address <span className="ml-auto text-sm">{lead.sourcing.companyAddress ?? "—"}</span></div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm text-gray-500 flex items-center gap-2">Supplier <span className="ml-auto font-medium">{lead.sourcing.supplierName ?? "—"}</span></div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">Supplier Contact <span className="ml-auto font-medium">{lead.sourcing.supplierContactNumber ?? "—"}</span></div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">Unit price <span className="ml-auto font-medium">{lead.sourcing.productUnitPrice ?? "—"}</span></div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-gray-500">Product detail</div>
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{lead.sourcing.productDetail ?? "—"}</div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {lead.sourcing.productCatalogue ? (
                      <a href={lead.sourcing.productCatalogue} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md border inline-flex items-center gap-2 hover:bg-gray-50">Open catalogue</a>
                    ) : (
                      <div className="text-sm text-gray-400">No catalogue uploaded</div>
                    )}

                    <div className="mt-2 sm:mt-0">
                      {lead.sourcing.uploadDocuments && lead.sourcing.uploadDocuments.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {lead.sourcing.uploadDocuments.map((d, i) => (
                            <a key={String(i)} href={d} target="_blank" rel="noreferrer" className="px-3 py-2 border rounded text-sm hover:bg-gray-50">Document {i + 1}</a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No documents</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping */}
            {lead.shipping && showSection("shipping") && (
              <div className={`${sectionColor("shipping")} rounded-2xl overflow-hidden shadow-sm`}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-md bg-white border border-gray-100 text-gray-700 inline-flex items-center"><Icon.Ship /></div>
                    <div>
                      <div className="text-sm font-semibold">Shipping</div>
                      <div className="text-xs text-gray-500">Logistics & docs</div>
                    </div>
                  </div>
                  <div>
                    <button onClick={() => toggle("shipping")} className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50">
                      <span className="text-sm">{expanded.shipping ? "Collapse" : "Expand"}</span>
                      <span className={`transform transition-transform ${expanded.shipping ? "rotate-180" : "rotate-0"}`}><Icon.ChevronDown /></span>
                    </button>
                  </div>
                </div>

                <div className={`p-4 transition-all ${expanded.shipping ? "max-h-screen opacity-100" : "max-h-0 opacity-0 p-0"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="text-sm text-gray-500 flex items-center gap-2">Item <span className="ml-auto font-medium">{lead.shipping.itemName ?? "—"}</span></div>
                      <div className="text-sm text-gray-500">Totals</div>
                      <div className="text-sm text-gray-700">CTN: {lead.shipping.totalCTN ?? 0} • KG: {lead.shipping.totalKG ?? 0} • PCS: {lead.shipping.totalPCS ?? 0}</div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm text-gray-500 flex items-center gap-2">HSN / Mode <span className="ml-auto font-medium">{lead.shipping.hsnCode ?? "—"} • {lead.shipping.shipmentMode ?? "—"}</span></div>

                      <div className="text-sm text-gray-500">Documents</div>
                      <div className="flex gap-2">
                        {lead.shipping.uploadInvoice ? (<a href={lead.shipping.uploadInvoice} target="_blank" rel="noreferrer" className="px-3 py-2 border rounded">Invoice</a>) : null}
                        {lead.shipping.uploadPackingList ? (<a href={lead.shipping.uploadPackingList} target="_blank" rel="noreferrer" className="px-3 py-2 border rounded">Packing List</a>) : null}
                        {!lead.shipping.uploadInvoice && !lead.shipping.uploadPackingList && <div className="text-sm text-gray-400">No docs</div>}
                      </div>

                      <div className="text-sm text-gray-500">Freight Rate <span className="ml-auto font-medium">{lead.shipping.freightRate ?? "—"}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales */}
            {lead.sales && showSection("sales") && (
              <div className={`${sectionColor("sales")} rounded-2xl overflow-hidden shadow-sm`}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-md bg-white border border-gray-100 text-gray-700 inline-flex items-center"><Icon.Briefcase /></div>
                    <div>
                      <div className="text-sm font-semibold">Sales</div>
                      <div className="text-xs text-gray-500">Order & tracking details</div>
                    </div>
                  </div>
                  <div>
                    <button onClick={() => toggle("sales")} className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50">
                      <span className="text-sm">{expanded.sales ? "Collapse" : "Expand"}</span>
                      <span className={`transform transition-transform ${expanded.sales ? "rotate-180" : "rotate-0"}`}><Icon.ChevronDown /></span>
                    </button>
                  </div>
                </div>

                <div className={`p-4 transition-all ${expanded.sales ? "max-h-screen opacity-100" : "max-h-0 opacity-0 p-0"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-500">Tracking Number</div>
                      <div className="font-medium">{lead.sales.trackingNumber ?? "—"}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Warehouse Receipt</div>
                      <div className="font-medium">{lead.sales.warehouseReceipt ?? "—"}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
