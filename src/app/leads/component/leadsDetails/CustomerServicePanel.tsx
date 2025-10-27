// src/app/leads/[id]/components/CustomerServicePanel.tsx
"use client";

import React from "react";
import type { Lead } from "@/types/leads";

interface Props {
  lead: Lead;
  expanded: boolean;
  onToggle: () => void;
  openViewer: (images: string[], index?: number) => void;
}

const Icon = {
  Person: () => (
    <span role="img" aria-label="person" className="text-base">
      👤
    </span>
  ),
  ChevronDown: () => (
    <span role="img" aria-label="chevron-down" className="text-sm">
      ▼
    </span>
  ),
  External: () => (
    <span role="img" aria-label="external" className="text-sm">
      ↗️
    </span>
  ),
  Image: () => (
    <span role="img" aria-label="image" className="text-2xl">
      🖼️
    </span>
  ),
};

export default function CustomerServicePanel({
  lead,
  expanded,
  onToggle,
  openViewer,
}: Props) {
  const products = lead.customerService?.products ?? [];

  return (
    <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-md bg-white border border-gray-100 text-gray-700 inline-flex items-center">
            <Icon.Person />
          </div>
          <div>
            <div className="text-sm font-semibold">Customer Service</div>
            <div className="text-xs text-gray-500">
              Customer & product details
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-sm"
            type="button"
          >
            <span>{expanded ? "Collapse" : "Expand"}</span>
            <span
              className={`transform transition-transform ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
            >
              <Icon.ChevronDown />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`transition-all ${
          expanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0 p-0"
        }`}
      >
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="space-y-3">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Customer{" "}
                <span className="ml-auto font-medium">
                  {lead.customerService?.customerName ?? "—"}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Contact{" "}
                <span className="ml-auto font-medium">
                  {lead.customerService?.contactNumber ?? "—"}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Address{" "}
                <span className="ml-auto text-sm">
                  {lead.customerService?.address ?? "—"}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                City{" "}
                <span className="ml-auto font-medium">
                  {lead.customerService?.city ?? "—"}
                  {lead.customerService?.state
                    ? `, ${lead.customerService.state}`
                    : ""}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Employee ID{" "}
                <span className="ml-auto font-medium">
                  {String(lead.customerService?.employeeId ?? "—")}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Manager ID{" "}
                <span className="ml-auto font-medium">
                  {String(lead.customerService?.managerId ?? "—")}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Marka{" "}
                <span className="ml-auto font-medium">
                  {lead.customerService?.marka ?? "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">
                Products ({products.length})
              </div>
              <div className="text-xs text-gray-500">
                Showing products in a compact table for better performance
              </div>
            </div>

            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">#</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left w-24">Qty</th>
                    <th className="px-3 py-2 text-left w-24">Size</th>
                    <th className="px-3 py-2 text-left w-28">Target</th>
                    <th className="px-3 py-2 text-left w-48">Images</th>
                    <th className="px-3 py-2 text-left w-48">Remark</th>
                    <th className="px-3 py-2 text-left w-24">Action</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y">
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-4 text-sm text-gray-500 text-center"
                      >
                        No products added
                      </td>
                    </tr>
                  ) : (
                    products.map((p, idx) => {
                      const files = p.uploadFiles ?? [];
                      const thumbFiles = files.slice(0, 4); // show up to 4 inline thumbs
                      return (
                        <tr key={String(idx)}>
                          <td className="px-3 py-3 align-top text-gray-600">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="font-medium">
                              {p.productName ?? "—"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {p.usage ? `Usage: ${p.usage}` : ""}
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            {String(p.quantity ?? "—")}
                          </td>
                          <td className="px-3 py-3 align-top">
                            {p.size ?? "—"}
                          </td>
                          <td className="px-3 py-3 align-top">
                            {String(p.targetPrice ?? "—")}
                          </td>

                          <td className="px-3 py-3 align-top">
                            {files.length === 0 ? (
                              <div className="text-gray-400 text-xs">
                                No images
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {/* Inline thumbnails (limited) */}
                                <div className="flex gap-2 overflow-x-auto">
                                  {thumbFiles.map((img, imgIdx) => (
                                    <button
                                      key={String(imgIdx)}
                                      onClick={() => openViewer(files, imgIdx)}
                                      type="button"
                                      className="w-12 h-12 rounded overflow-hidden border flex-shrink-0"
                                      title={`Open image ${imgIdx + 1}`}
                                    >
                                      <img
                                        src={img}
                                        alt={`${
                                          p.productName ?? "product"
                                        }-${imgIdx}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                      />
                                    </button>
                                  ))}
                                </div>

                                {/* If there are more images, show a small badge */}
                                {files.length > thumbFiles.length && (
                                  <div className="text-xs text-gray-500">
                                    +{files.length - thumbFiles.length}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-3 align-top">
                            <div className="text-sm text-gray-700">
                              {p.remark ?? "—"}
                            </div>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openViewer(files, 0)}
                                type="button"
                                className="inline-flex items-center gap-2 px-2 py-1 border rounded text-xs bg-white hover:bg-gray-50"
                                disabled={files.length === 0}
                              >
                                View <Icon.External />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Helpful note for very large lists */}
            {products.length > 20 && (
              <div className="mt-2 text-xs text-gray-500">
                Tip: Showing a compact table improves performance when you have
                many products. Click View to open product images in the gallery.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
