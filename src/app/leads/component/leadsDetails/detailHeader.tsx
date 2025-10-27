// src/app/leads/[id]/components/Header.tsx
"use client";

import React from "react";
import type { Lead } from "@/types/leads";

type SectionKey = "all" | "customerService" | "sourcing" | "shipping" | "sales";

interface Props {
  lead: Lead;
  selectedSection: SectionKey;
  setSelectedSection: (s: SectionKey) => void;
  onBack: () => void;
  onExportCsv: () => void; // treated as Excel export
  onExportPdf: () => void;
}

/* Minimal inline SVG icons (no external deps) */
const Icon = {
  Id: () => <span role="img" aria-label="id" className="text-sm">🆔</span>,
  Phone: () => <span role="img" aria-label="phone" className="text-sm">📞</span>,
  Location: () => <span role="img" aria-label="location" className="text-sm">📍</span>,
  Back: () => <span role="img" aria-label="back" className="text-sm">◀️</span>,
  Excel: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="1" y="3" width="22" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 7h10v3H7z" fill="currentColor" opacity="0.08" />
      <path d="M8 14l3-3M11 14l-3-3M13 11l3 3M16 11l-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 18h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Pdf: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 2h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M13 2v6h6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M9.5 13.5c1.5-1.5 3 0 0 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

export default function Header({
  lead,
  selectedSection,
  setSelectedSection,
  onBack,
  onExportCsv,
  onExportPdf
}: Props) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-xl p-3 md:p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {/* Left: id + customer */}
        <div className="flex items-center gap-3">
          <div className="rounded-md px-2 py-1 bg-white border border-gray-100 text-xs font-medium inline-flex items-center gap-2">
            <span className="text-sm"><Icon.Id /></span>
            <span className="font-mono text-sm leading-4">{lead.leadId}</span>
          </div>

          <div className="min-w-0">
            <div className="text-xs text-gray-500 flex items-center gap-2 truncate">
              <span className="inline-flex items-center gap-1"><Icon.Phone /> <span className="truncate">{lead.customerService?.contactNumber ?? "—"}</span></span>
              <span>•</span>
              <span className="inline-flex items-center gap-1"><Icon.Location /> <span className="truncate">{lead.customerService?.city ?? "—"}{lead.customerService?.state ? `, ${lead.customerService.state}` : ""}</span></span>
            </div>

            <h2 className="text-sm md:text-base font-semibold mt-1 leading-5 truncate">{lead.customerService?.customerName ?? "—"}</h2>

            <div className="mt-1 text-xs text-gray-600 inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-xs">Status: <span className="capitalize font-medium ml-1">{lead.currentStatus ?? "—"}</span></span>
              <span className="inline-flex items-center gap-1 text-xs">Assigned: <strong className="ml-1">{lead.currentAssignedEmployee?.employeeName ?? "—"}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: controls (compact) */}
        <div className="flex items-center gap-2">
          {/* section selector (compact pills) */}
          <div className="hidden sm:flex items-center gap-1 bg-transparent p-0 rounded-md">
            {(["all","customerService","sourcing","shipping","sales"] as SectionKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSection(s)}
                className={`px-2.5 py-1 text-xs rounded-md transition flex items-center justify-center ${selectedSection === s ? "bg-white shadow-sm font-medium border border-gray-100" : "text-gray-600 hover:bg-gray-50"}`}
                title={s === "all" ? "All" : s === "customerService" ? "Customer" : s === "sourcing" ? "Sourcing" : s === "shipping" ? "Shipping" : "Sales"}
                type="button"
              >
                {s === "all" ? "All" : s === "customerService" ? "Cust" : s === "sourcing" ? "Src" : s === "shipping" ? "Ship" : "Sales"}
              </button>
            ))}
          </div>

          {/* export buttons: show icon (small), text on md+ */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              title="Export to Excel (CSV)"
              type="button"
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border bg-white hover:bg-gray-50 text-xs"
            >
              <Icon.Excel className="w-4 h-4" />
              <span className="hidden md:inline">Excel</span>
            </button>

            <button
              onClick={onExportPdf}
              title="Export to PDF (print)"
              type="button"
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border bg-white hover:bg-gray-50 text-xs"
            >
              <Icon.Pdf className="w-4 h-4" />
              <span className="hidden md:inline">PDF</span>
            </button>

            <button
              onClick={onBack}
              title="Go back"
              type="button"
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border bg-white hover:bg-gray-50 text-xs"
            >
              <Icon.Back />
              <span className="hidden md:inline">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* mobile select */}
      <div className="mt-2 sm:hidden">
        <select
          className="w-full rounded-md border px-2 py-2 bg-white text-sm"
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
  );
}
