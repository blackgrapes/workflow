// src/app/leads/[id]/components/SalesPanel.tsx
"use client";

import React from "react";
import type { Lead } from "@/types/leads";

interface Props {
  lead: Lead;
  expanded: boolean;
  onToggle: () => void;
}

const Icon = {
  Briefcase: () => <span role="img" aria-label="briefcase" className="text-base">💼</span>,
  ChevronDown: () => <span role="img" aria-label="chevron-down" className="text-sm">▼</span>,
};

export default function SalesPanel({ lead, expanded, onToggle }: Props) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-md bg-white border border-gray-100 text-gray-700 inline-flex items-center"><Icon.Briefcase /></div>
          <div>
            <div className="text-sm font-semibold">Sales</div>
            <div className="text-xs text-gray-500">Order & tracking details</div>
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
          <div>
            <div className="text-sm text-gray-500">Tracking Number</div>
            <div className="font-medium">{lead.sales?.trackingNumber ?? "—"}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Warehouse Receipt</div>
            <div className="font-medium">{lead.sales?.warehouseReceipt ?? "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
