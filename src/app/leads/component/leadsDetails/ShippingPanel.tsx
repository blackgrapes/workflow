// src/app/leads/[id]/components/ShippingPanel.tsx
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
  Ship: () => <span role="img" aria-label="ship" className="text-base">🚢</span>,
  ChevronDown: () => <span role="img" aria-label="chevron-down" className="text-sm">▼</span>,
};

export default function ShippingPanel({ lead, expanded, onToggle }: Props) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-md bg-white border border-gray-100 text-gray-700 inline-flex items-center"><Icon.Ship /></div>
          <div>
            <div className="text-sm font-semibold">Shipping</div>
            <div className="text-xs text-gray-500">Logistics & docs</div>
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
            <div className="text-sm text-gray-500 flex items-center gap-2">Item <span className="ml-auto font-medium">{lead.shipping?.itemName ?? "—"}</span></div>
            <div className="text-sm text-gray-500">Totals</div>
            <div className="text-sm text-gray-700">CTN: {lead.shipping?.totalCTN ?? 0} • KG: {lead.shipping?.totalKG ?? 0} • PCS: {lead.shipping?.totalPCS ?? 0}</div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-500 flex items-center gap-2">HSN / Mode <span className="ml-auto font-medium">{lead.shipping?.hsnCode ?? "—"} • {lead.shipping?.shipmentMode ?? "—"}</span></div>

            <div className="text-sm text-gray-500">Documents</div>
            <div className="flex gap-2">
              {lead.shipping?.uploadInvoice ? (<a href={lead.shipping.uploadInvoice} target="_blank" rel="noreferrer" className="px-3 py-2 border rounded">Invoice</a>) : null}
              {lead.shipping?.uploadPackingList ? (<a href={lead.shipping.uploadPackingList} target="_blank" rel="noreferrer" className="px-3 py-2 border rounded">Packing List</a>) : null}
              {!lead.shipping?.uploadInvoice && !lead.shipping?.uploadPackingList && <div className="text-sm text-gray-400">No docs</div>}
            </div>

            <div className="text-sm text-gray-500">Freight Rate <span className="ml-auto font-medium">{lead.shipping?.freightRate ?? "—"}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
