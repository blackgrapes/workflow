// src/app/leads/[id]/components/SourcingPanel.tsx
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
  Factory: () => <span role="img" aria-label="factory" className="text-base">🏭</span>,
  ChevronDown: () => <span role="img" aria-label="chevron-down" className="text-sm">▼</span>,
};

export default function SourcingPanel({ lead, expanded, onToggle }: Props) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-md bg-white border border-gray-100 text-gray-700 inline-flex items-center"><Icon.Factory /></div>
          <div>
            <div className="text-sm font-semibold">Sourcing</div>
            <div className="text-xs text-gray-500">Supplier & catalogue</div>
          </div>
        </div>
        <div>
          <button onClick={onToggle} className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50">
            <span className="text-sm">{expanded ? "Collapse" : "Expand"}</span>
            <span className={`transform transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}><Icon.ChevronDown /></span>
          </button>
        </div>
      </div>

      <div className={`p-4 transition-all ${expanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0 p-0"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-sm text-gray-500 flex items-center gap-2">Product <span className="ml-auto font-medium">{lead.sourcing?.productName || "—"}</span></div>
            <div className="text-sm text-gray-500 flex items-center gap-2">Company <span className="ml-auto font-medium">{lead.sourcing?.companyName ?? "—"}</span></div>
            <div className="text-sm text-gray-500 flex items-center gap-2">Company Address <span className="ml-auto text-sm">{lead.sourcing?.companyAddress ?? "—"}</span></div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-500 flex items-center gap-2">Supplier <span className="ml-auto font-medium">{lead.sourcing?.supplierName ?? "—"}</span></div>
            <div className="text-sm text-gray-500 flex items-center gap-2">Supplier Contact <span className="ml-auto font-medium">{lead.sourcing?.supplierContactNumber ?? "—"}</span></div>
            <div className="text-sm text-gray-500 flex items-center gap-2">Unit price <span className="ml-auto font-medium">{lead.sourcing?.productUnitPrice ?? "—"}</span></div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-500">Product detail</div>
          <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{lead.sourcing?.productDetail ?? "—"}</div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          {lead.sourcing?.productCatalogue ? (
            <a href={lead.sourcing.productCatalogue} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md border inline-flex items-center gap-2 hover:bg-gray-50">Open catalogue</a>
          ) : (
            <div className="text-sm text-gray-400">No catalogue uploaded</div>
          )}

          <div className="mt-2 sm:mt-0">
            {lead.sourcing?.uploadDocuments && lead.sourcing.uploadDocuments.length > 0 ? (
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
  );
}
