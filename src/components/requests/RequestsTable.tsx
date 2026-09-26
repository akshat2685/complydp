"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ExternalLink,
} from "lucide-react";
import { PrivacyRequest, RequestStatus, RequestType } from "@/types";
import { useComplyDP } from "@/context/AppContext";
import { RequestDetailDrawer } from "./RequestDetailDrawer";

export function RequestsTable() {
  const ctx = useComplyDP();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedRequest, setSelectedRequest] = useState<PrivacyRequest | null>(null);

  const requests = ctx.requests;

  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.requesterRef.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-3">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search request ID, requester, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
          {["All", "In Progress", "Waiting", "Assigned", "Completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="op-table-header">
              <th className="px-3.5 py-2">Case ID</th>
              <th className="px-3.5 py-2">Right Exercised</th>
              <th className="px-3.5 py-2">Requester (Masked)</th>
              <th className="px-3.5 py-2">Status</th>
              <th className="px-3.5 py-2">Verification</th>
              <th className="px-3.5 py-2">SLA Clock</th>
              <th className="px-3.5 py-2">Owner</th>
              <th className="px-3.5 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filtered.map((req) => (
              <tr
                key={req.id}
                className="hover:bg-slate-50/80 transition cursor-pointer"
                onClick={() => setSelectedRequest(req)}
              >
                <td className="px-3.5 py-2.5 font-bold text-slate-900">{req.id}</td>
                <td className="px-3.5 py-2.5 font-sans font-medium text-slate-800">
                  {req.type}
                </td>
                <td className="px-3.5 py-2.5 text-slate-600">{req.requesterRef}</td>
                <td className="px-3.5 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      req.status === "In Progress"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : req.status === "Waiting"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : req.status === "Completed"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-3.5 py-2.5">
                  <span
                    className={`text-[10px] ${
                      req.verificationStatus === "Verified"
                        ? "text-emerald-700 font-medium"
                        : "text-amber-700"
                    }`}
                  >
                    {req.verificationStatus}
                  </span>
                </td>
                <td className="px-3.5 py-2.5">
                  <span
                    className={`font-semibold ${
                      req.daysRemaining <= 2
                        ? "text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded"
                        : req.daysRemaining <= 5
                        ? "text-amber-800"
                        : "text-slate-600"
                    }`}
                  >
                    {req.status === "Completed" ? "Resolved" : `${req.daysRemaining} days left`}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 font-sans text-slate-700">{req.owner}</td>
                <td className="px-3.5 py-2.5 text-right font-sans">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(req);
                    }}
                    className="px-2 py-1 text-[11px] text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RequestDetailDrawer
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
