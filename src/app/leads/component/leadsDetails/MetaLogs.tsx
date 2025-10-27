// src/app/leads/[id]/components/PartOneMetaLogs.tsx
"use client";

import React from "react";
import type { Lead } from "@/types/leads";

interface Props {
  lead: Lead;
  openViewer: (images: string[], index?: number) => void;
}

const Icon = {
  Calendar: () => <span role="img" aria-label="calendar" className="text-sm">📅</span>,
  Clock: () => <span role="img" aria-label="clock" className="text-sm">🕒</span>,
};

export default function PartOneMetaLogs({ lead }: Props) {
  return (
    <>
      <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500"><Icon.Calendar /></span>
            <h3 className="text-sm font-semibold">Meta</h3>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400"><Icon.Calendar /></span>
            Created:
            <span className="ml-auto font-medium">
              {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "—"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400"><Icon.Clock /></span>
            Updated:
            <span className="ml-auto font-medium">
              {lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : "—"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Marka:</span>
            <span className="ml-auto font-medium">
              {lead.customerService?.marka ?? lead.shipping?.marka ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500"><Icon.Clock /></span>
          <h3 className="text-sm font-semibold">Logs</h3>
        </div>

        <div className="mt-3 max-h-56 overflow-auto text-sm text-gray-700 space-y-3">
          {lead.logs && lead.logs.length > 0 ? (
            <div className="relative pl-4">
              <div className="absolute left-1 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-4">
                {lead.logs.map((l, idx) => (
                  <div key={String(idx)} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                      {String(idx + 1)}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">
                        {l.employeeName} •{" "}
                        <span className="text-gray-400">
                          {l.timestamp ? new Date(l.timestamp).toLocaleString() : ""}
                        </span>
                      </div>
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
    </>
  );
}
