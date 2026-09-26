"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  FileText,
  Calendar,
  CheckSquare,
  Square,
  Hash,
} from "lucide-react";
import { PrivacyRequest, RequestStatus } from "@/types";
import { useComplyDP } from "@/context/AppContext";

interface RequestDetailDrawerProps {
  request: PrivacyRequest | null;
  onClose: () => void;
}

export function RequestDetailDrawer({ request, onClose }: RequestDetailDrawerProps) {
  const ctx = useComplyDP();
  const [resolutionText, setResolutionText] = useState(request?.notes || "");

  if (!request) return null;

  const statuses: RequestStatus[] = [
    "Submitted",
    "Verification",
    "Assigned",
    "In Progress",
    "Waiting",
    "Completed",
    "Rejected",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white h-full shadow-drawer flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 border border-slate-300 rounded">
              {request.id}
            </span>
            <span className="text-xs text-slate-600 font-medium">{request.type}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* Status & SLA Alert Header */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Case Status</span>
              <select
                value={request.status}
                onChange={(e) =>
                  ctx.updateRequestStatus(request.id, e.target.value as RequestStatus)
                }
                className="mt-1 font-mono text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">
                DPDP Statutory Deadline
              </span>
              <div className="flex items-center space-x-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span
                  className={`font-mono font-bold ${
                    request.daysRemaining <= 2 ? "text-red-700" : "text-slate-800"
                  }`}
                >
                  {request.daysRemaining} days remaining
                </span>
              </div>
            </div>
          </div>

          {/* Requester Metadata */}
          <div className="border border-slate-200 rounded p-3.5 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Data Principal Reference
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">Masked Identifier:</span>
                <span className="font-semibold text-slate-900 font-mono">{request.requesterRef}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">Verification:</span>
                <span
                  className={`inline-block font-mono text-[11px] font-semibold ${
                    request.verificationStatus === "Verified"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {request.verificationStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">Assigned Case Lead:</span>
                <span className="text-slate-800">{request.owner}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono">Submitted Date:</span>
                <span className="text-slate-800 font-mono">
                  {new Date(request.submittedAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Task Checklist */}
          <div className="border border-slate-200 rounded p-3.5 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Required Operational Tasks</span>
              <span className="text-slate-400 text-[10px]">
                {request.tasks.filter((t) => t.completed).length} / {request.tasks.length} Done
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {request.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => ctx.toggleRequestTask(request.id, task.id)}
                  className="py-2 flex items-start space-x-2.5 cursor-pointer hover:bg-slate-50 px-1 rounded transition"
                >
                  {task.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs ${
                        task.completed
                          ? "line-through text-slate-400"
                          : "text-slate-800 font-medium"
                      }`}
                    >
                      {task.title}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Assignee: {task.assignedTo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Notes & Statutory Retention Exclusions */}
          <div className="border border-slate-200 rounded p-3.5 space-y-2 bg-slate-50/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Retention & Legal Assessment Notes
            </div>
            <p className="text-slate-700 leading-relaxed text-xs">{request.notes}</p>
          </div>

          {/* Resolution Receipt Hash */}
          {request.resolutionEvidenceHash && (
            <div className="border border-emerald-200 bg-emerald-50/50 rounded p-3.5 space-y-1 font-mono text-[11px]">
              <div className="text-emerald-900 font-semibold flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cryptographic Resolution Receipt</span>
              </div>
              <span className="text-[10px] text-slate-600 break-all block bg-white p-1 rounded border border-emerald-200">
                {request.resolutionEvidenceHash}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-white hover:bg-slate-100"
          >
            Close
          </button>
          <button
            onClick={() => {
              ctx.updateRequestStatus(request.id, "Completed");
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-subtle flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete Case & Issue Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
