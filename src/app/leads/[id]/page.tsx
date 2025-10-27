// src/app/leads/[id]/page.tsx
"use client";

import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Lead } from "@/types/leads";
import { getLeadById } from "@/lib/frontendApis/employees/apis";
import LoadingSkeleton from "@/app/component/loading/loading";
import CustomerServicePanel from "../component/leadsDetails/CustomerServicePanel";
import PartOneMetaLogs from "../component/leadsDetails/MetaLogs";
import SourcingPanel from "../component/leadsDetails/SourcingPanel";
import ShippingPanel from "../component/leadsDetails/ShippingPanel";
import SalesPanel from "../component/leadsDetails/SalesPanel";
import Header from "../component/leadsDetails/detailHeader";

/*
 Parent responsibilities:
 - fetch lead
 - keep the shared image viewer state & openViewer function
 - provide export (CSV & printable PDF) for full lead
 - control which section is shown (segment control)
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

/* export helpers (CSV & printable) */
function objectToCsv(rows: string[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const escaped = String(c ?? "").replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\r\n");
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

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

  // Image viewer (shared) state
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number>(0);

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
    return () => { cancelled = true; };
  }, [id]);

  // keyboard navigation for viewer
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerOpen(false);
      else if (e.key === "ArrowLeft") setViewerIndex((i) => (viewerImages.length ? (i - 1 + viewerImages.length) % viewerImages.length : 0));
      else if (e.key === "ArrowRight") setViewerIndex((i) => (viewerImages.length ? (i + 1) % viewerImages.length : 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, viewerImages.length]);

  const openViewer = (images: string[], index = 0) => {
    if (!images || images.length === 0) return;
    setViewerImages(images);
    setViewerIndex(Math.max(0, Math.min(index, images.length - 1)));
    setViewerOpen(true);
  };

  const closeViewer = () => setViewerOpen(false);
  const prevImage = () => setViewerIndex((i) => (viewerImages.length ? (i - 1 + viewerImages.length) % viewerImages.length : 0));
  const nextImage = () => setViewerIndex((i) => (viewerImages.length ? (i + 1) % viewerImages.length : 0));

  const toggle = (key: SectionKey) => setExpanded((s) => ({ ...s, [key]: !s[key] }));

  const showSection = useMemo(() => (section: SectionKey) => {
    if (selectedSection === "all") return true;
    return selectedSection === section;
  }, [selectedSection]);

  /* Export: CSV - flattened (use Marka from customerService only) */
  const exportAsCsv = () => {
    if (!lead) return;
    const rows: string[][] = [];

    const marka = lead.customerService?.marka ?? "";

    rows.push(["Lead ID", lead.leadId ?? ""]);
    rows.push(["Status", lead.currentStatus ?? ""]);
    rows.push(["Assigned Employee", lead.currentAssignedEmployee?.employeeName ?? ""]);
    // Marka from customerService
    rows.push(["Marka", marka]);
    rows.push([]);
    rows.push(["Customer Service"]);
    rows.push(["Customer Name", lead.customerService?.customerName ?? ""]);
    rows.push(["Contact", lead.customerService?.contactNumber ?? ""]);
    rows.push(["Address", lead.customerService?.address ?? ""]);
    rows.push(["City", `${lead.customerService?.city ?? ""}${lead.customerService?.state ? `, ${lead.customerService.state}` : ""}`]);
    rows.push(["Marka (Customer Service)", marka]);
    rows.push([]);

    // products
    rows.push(["Products (one row per product image)"]);
    rows.push(["Product Name", "Quantity", "Size", "Target Price", "Image URL"]);
    if (lead.customerService?.products && lead.customerService.products.length > 0) {
      lead.customerService.products.forEach((p) => {
        const files = p.uploadFiles ?? [];
        if (files.length === 0) {
          rows.push([p.productName ?? "", String(p.quantity ?? ""), p.size ?? "", String(p.targetPrice ?? ""), ""]);
        } else {
          files.forEach((f) => {
            rows.push([p.productName ?? "", String(p.quantity ?? ""), p.size ?? "", String(p.targetPrice ?? ""), f]);
          });
        }
      });
    }
    rows.push([]);

    // sourcing
    rows.push(["Sourcing"]);
    rows.push(["Product", lead.sourcing?.productName ?? ""]);
    rows.push(["Company", lead.sourcing?.companyName ?? ""]);
    rows.push(["Supplier", lead.sourcing?.supplierName ?? ""]);
    rows.push([]);

    // shipping
    rows.push(["Shipping"]);
    rows.push(["Item Name", lead.shipping?.itemName ?? ""]);
    rows.push(["Totals", `CTN:${lead.shipping?.totalCTN ?? 0} KG:${lead.shipping?.totalKG ?? 0} PCS:${lead.shipping?.totalPCS ?? 0}`]);
    rows.push([]);

    // sales
    rows.push(["Sales"]);
    rows.push(["Tracking Number", lead.sales?.trackingNumber ?? ""]);
    rows.push(["Warehouse Receipt", lead.sales?.warehouseReceipt ?? ""]);
    rows.push([]);

    // logs
    rows.push(["Logs"]);
    rows.push(["Employee", "Timestamp", "Comment"]);
    if (lead.logs && lead.logs.length > 0) {
      lead.logs.forEach((l) => {
        rows.push([l.employeeName ?? "", l.timestamp ? new Date(l.timestamp).toLocaleString() : "", l.comment ?? ""]);
      });
    }

    const csv = objectToCsv(rows);
    // add BOM so Excel reliably recognizes UTF-8
    const csvWithBom = "\uFEFF" + csv;
    downloadFile(`${lead.leadId ?? "lead"}.csv`, csvWithBom, "text/csv;charset=utf-8;");
  };

  /* Export: printable (user can Save as PDF)
     Improved strategy:
     - Build HTML string that includes a small script which waits for images to load
       before calling window.print(). That script will also post back a message
       on completion in case we need to detect it.
     - We open a new window, write the HTML, then focus & rely on the injected script
       to run print once images/resources have loaded.
     - If popups are blocked or print fails, a fallback blob download of the HTML is provided.
  */
  const exportAsPdf = () => {
    if (!lead) return;

    const marka = lead.customerService?.marka ?? "";

    // Build HTML content. The embedded script waits for images to finish loading before printing.
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${lead.leadId ?? "Lead"}</title>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            body{font-family: Arial, sans-serif; padding:20px; color:#111; line-height:1.4}
            h1{font-size:18px; margin:0 0 12px 0}
            h3{margin:10px 0 6px 0}
            .section{margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px}
            .k{font-weight:600; width:200px; display:inline-block}
            .product{margin-bottom:8px}
            img{max-width:200px; max-height:150px; margin:6px; display:inline-block}
            table{border-collapse:collapse; width:100%; margin-top:8px}
            th,td{border:1px solid #ddd; padding:6px; text-align:left; font-size:13px}
            @media print {
              img{max-width:200px; max-height:150px}
            }
          </style>
        </head>
        <body>
          <h1>Lead ${lead.leadId ?? ""}</h1>

          <div class="section">
            <div><span class="k">Status:</span>${lead.currentStatus ?? ""}</div>
            <div><span class="k">Assigned:</span>${lead.currentAssignedEmployee?.employeeName ?? ""}</div>
          </div>

          <div class="section">
            <h3>Customer Service</h3>
            <div><span class="k">Customer:</span>${lead.customerService?.customerName ?? ""}</div>
            <div><span class="k">Contact:</span>${lead.customerService?.contactNumber ?? ""}</div>
            <div><span class="k">Address:</span>${lead.customerService?.address ?? ""}</div>
            <div><span class="k">City:</span>${lead.customerService?.city ?? ""}</div>
            <div><span class="k">Marka:</span>${marka}</div>

            ${(lead.customerService?.products ?? []).map((p) => `
              <div class="product">
                <div><strong>${p.productName ?? ""}</strong></div>
                <div>Qty: ${p.quantity ?? ""} Size: ${p.size ?? ""} Target: ${p.targetPrice ?? ""}</div>
                <div>
                  ${(p.uploadFiles ?? []).map((u) => `<img src="${u}" />`).join("")}
                </div>
              </div>
            `).join("")}
          </div>

          <div class="section">
            <h3>Sourcing</h3>
            <div><span class="k">Product:</span>${lead.sourcing?.productName ?? ""}</div>
            <div><span class="k">Company:</span>${lead.sourcing?.companyName ?? ""}</div>
          </div>

          <div class="section">
            <h3>Shipping</h3>
            <div><span class="k">Item:</span>${lead.shipping?.itemName ?? ""}</div>
            <div><span class="k">Totals:</span>CTN:${lead.shipping?.totalCTN ?? 0} KG:${lead.shipping?.totalKG ?? 0} PCS:${lead.shipping?.totalPCS ?? 0}</div>
            <div>
              ${lead.shipping?.uploadInvoice ? `<div><strong>Invoice:</strong> <a href="${lead.shipping.uploadInvoice}">${lead.shipping.uploadInvoice}</a></div>` : ""}
              ${lead.shipping?.uploadPackingList ? `<div><strong>Packing List:</strong> <a href="${lead.shipping.uploadPackingList}">${lead.shipping.uploadPackingList}</a></div>` : ""}
            </div>
          </div>

          <div class="section">
            <h3>Sales</h3>
            <div><span class="k">Tracking:</span>${lead.sales?.trackingNumber ?? ""}</div>
            <div><span class="k">Warehouse Receipt:</span>${lead.sales?.warehouseReceipt ?? ""}</div>
          </div>

          <div class="section">
            <h3>Logs</h3>
            ${(lead.logs ?? []).length > 0 ? `
              <table>
                <thead><tr><th>Employee</th><th>Timestamp</th><th>Comment</th></tr></thead>
                <tbody>
                  ${(lead.logs ?? []).map((l) => `<tr><td>${l.employeeName ?? ""}</td><td>${l.timestamp ? new Date(l.timestamp).toLocaleString() : ""}</td><td>${(l.comment ?? "").replace(/</g,'&lt;')}</td></tr>`).join("")}
                </tbody>
              </table>
            ` : `<div>No logs available</div>`}
          </div>

          <script>
            (function() {
              // Wait for all images to load (or error) before triggering print
              function whenImagesLoaded(timeoutMs) {
                return new Promise(function(resolve) {
                  var imgs = Array.from(document.images || []);
                  if (imgs.length === 0) { resolve(); return; }
                  var completed = 0;
                  var done = function() {
                    completed++;
                    if (completed >= imgs.length) resolve();
                  };
                  imgs.forEach(function(img){
                    if (img.complete) { done(); }
                    else {
                      img.addEventListener('load', done);
                      img.addEventListener('error', done);
                    }
                  });
                  // safety timeout in case some images hang
                  setTimeout(resolve, timeoutMs || 3000);
                });
              }

              function tryPrint() {
                try {
                  window.focus();
                  window.print();
                } catch (e) {
                  // ignore printing errors
                }
              }

              // Wait for DOMContentLoaded then images, then print
              if (document.readyState === 'complete') {
                whenImagesLoaded(4000).then(tryPrint);
              } else {
                window.addEventListener('load', function() {
                  whenImagesLoaded(4000).then(tryPrint);
                });
              }
            })();
          </script>
        </body>
      </html>`;

    // Try to open a new window and write HTML into it.
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      // Popup blocked -> fallback: create blob and trigger download of HTML so user can open and print manually
      const blob = new Blob([html], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      downloadFile(`${lead.leadId ?? "lead"}.html`, html, "text/html");
      // also open blob in new tab if allowed (may still be blocked)
      try {
        window.open(blobUrl, "_blank");
      } catch (e) {
        // ignore
      }
      // revoke after some time
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      return;
    }

    try {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      // focus and rely on embedded script to call print after images loaded
      printWindow.focus();
    } catch (err) {
      // If writing fails for any reason, fallback to downloading html
      const blob = new Blob([html], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      downloadFile(`${lead.leadId ?? "lead"}.html`, html, "text/html");
      try { window.open(blobUrl, "_blank"); } catch (e) { /* ignore */ }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <div className="mt-4 flex gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-white hover:bg-gray-50" onClick={() => router.back()} type="button">Back</button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Lead not found.</div>
        <button className="mt-4 px-3 py-2 border rounded" onClick={() => router.back()} type="button">Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="sticky top-4 z-20">
          <Header
            lead={lead}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            onBack={() => router.back()}
            onExportCsv={exportAsCsv}
            onExportPdf={exportAsPdf}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          {/* Part 1: Meta + Logs */}
          <aside className="md:col-span-1 space-y-4">
            <PartOneMetaLogs
              lead={lead}
              openViewer={openViewer}
            />
          </aside>

          {/* Parts 2-5 in main column */}
          <main className="md:col-span-3 space-y-6">
            {/* Customer Service */}
            {lead.customerService && showSection("customerService") && (
              <CustomerServicePanel
                lead={lead}
                expanded={expanded.customerService}
                onToggle={() => toggle("customerService")}
                openViewer={openViewer}
              />
            )}

            {/* Sourcing */}
            {lead.sourcing && showSection("sourcing") && (
              <SourcingPanel
                lead={lead}
                expanded={expanded.sourcing}
                onToggle={() => toggle("sourcing")}
                openViewer={openViewer}
              />
            )}

            {/* Shipping */}
            {lead.shipping && showSection("shipping") && (
              <ShippingPanel
                lead={lead}
                expanded={expanded.shipping}
                onToggle={() => toggle("shipping")}
                openViewer={openViewer}
              />
            )}

            {/* Sales */}
            {lead.sales && showSection("sales") && (
              <SalesPanel
                lead={lead}
                expanded={expanded.sales}
                onToggle={() => toggle("sales")}
              />
            )}
          </main>
        </div>
      </div>

      {/* Shared image viewer modal */}
      {viewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button onClick={closeViewer} className="absolute top-2 right-2 z-60 px-3 py-2 bg-white rounded shadow" aria-label="Close viewer" type="button">Close</button>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-60 px-3 py-2 bg-white rounded shadow hidden md:inline-flex" aria-label="Previous image" type="button">◀</button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-60 px-3 py-2 bg-white rounded shadow hidden md:inline-flex" aria-label="Next image" type="button">▶</button>

            <div className="w-full h-full flex items-center justify-center">
              <img src={viewerImages[viewerIndex]} alt={`image-${viewerIndex}`} className="max-w-full max-h-[80vh] object-contain rounded" />
            </div>

            <div className="mt-2 text-center text-sm text-white/90">
              {viewerIndex + 1} / {viewerImages.length}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto">
              {viewerImages.map((img, idx) => (
                <button key={String(idx)} onClick={() => setViewerIndex(idx)} type="button" className={`w-12 h-12 rounded overflow-hidden border ${idx === viewerIndex ? "ring-2 ring-white" : ""}`}>
                  <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
