"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getInitialState,
  generateEvidenceHash,
} from "@/lib/store";
import {
  ComplyDPState,
  CookieCategory,
  Finding,
  RequestStatus,
  DiscoveredCookie,
  PersonalDataField,
} from "@/types";

interface AppContextType extends ComplyDPState {
  resolveFinding: (findingId: string, note?: string) => void;
  approveCookieClassification: (cookieId: string, category: CookieCategory) => void;
  triggerWebsiteScan: () => void;
  triggerGitHubScan: () => void;
  approveFieldMapping: (fieldId: string, activityId: string) => void;
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  toggleRequestTask: (requestId: string, taskId: string) => void;
  updateIncidentObligation: (
    incidentId: string,
    obligationId: string,
    status: "Pending" | "In Preparation" | "Submitted"
  ) => void;
  setSelectedFindingId: (id: string | null) => void;
  setSelectedRequestId: (id: string | null) => void;
  setSelectedIncidentId: (id: string | null) => void;
  resetToDemo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ComplyDPState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("complydp_state_v1");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback to initial
        }
      }
    }
    return getInitialState();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("complydp_state_v1", JSON.stringify(state));
    }
  }, [state]);

  const resolveFinding = (findingId: string, note?: string) => {
    setState((prev) => ({
      ...prev,
      findings: prev.findings.map((f) =>
        f.id === findingId
          ? {
              ...f,
              status: "Resolved",
              reviewedBy: "Priya Sharma (DPO)",
              evidence: {
                ...f.evidence,
                reviewer: "Priya Sharma (DPO)",
                reviewedAt: new Date().toISOString(),
                notes: note || "Verified and resolved via compliance workflow.",
              },
            }
          : f
      ),
    }));
  };

  const approveCookieClassification = (
    cookieId: string,
    category: CookieCategory
  ) => {
    setState((prev) => {
      const updatedCookies = prev.webProperty.cookies.map((c) =>
        c.id === cookieId
          ? {
              ...c,
              category,
              approvalState: "Approved" as const,
              evidence: {
                ...c.evidence,
                reviewer: "Priya Sharma (DPO)",
                reviewedAt: new Date().toISOString(),
              },
            }
          : c
      );

      // If resolving the Segment finding specifically:
      const updatedFindings = prev.findings.map((f) => {
        if (
          f.type === "CONSENT_GAP" &&
          f.title.includes("Segment") &&
          cookieId === "ck_02"
        ) {
          return {
            ...f,
            status: "Resolved" as const,
            reviewedBy: "Priya Sharma (DPO)",
          };
        }
        if (
          f.type === "NEW_TRACKER" &&
          f.title.includes("ajs_anonymous_id") &&
          cookieId === "ck_02"
        ) {
          return {
            ...f,
            status: "Resolved" as const,
            reviewedBy: "Priya Sharma (DPO)",
          };
        }
        return f;
      });

      return {
        ...prev,
        webProperty: {
          ...prev.webProperty,
          cookies: updatedCookies,
        },
        findings: updatedFindings,
      };
    });
  };

  const triggerWebsiteScan = () => {
    setState((prev) => ({ ...prev, scanInProgress: true, scanProgress: 15 }));

    const steps = [
      { progress: 40, delay: 600 },
      { progress: 75, delay: 1200 },
      { progress: 100, delay: 1800 },
    ];

    steps.forEach(({ progress, delay }) => {
      setTimeout(() => {
        setState((prev) => {
          if (progress === 100) {
            return {
              ...prev,
              scanInProgress: false,
              scanProgress: 100,
              webProperty: {
                ...prev.webProperty,
                lastScanTime: new Date().toISOString(),
                activeTrackersCount: 7,
                cookiesCount: 18,
              },
            };
          }
          return { ...prev, scanProgress: progress };
        });
      }, delay);
    });
  };

  const triggerGitHubScan = () => {
    setState((prev) => ({ ...prev, gitHubScanInProgress: true }));
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        gitHubScanInProgress: false,
      }));
    }, 1500);
  };

  const approveFieldMapping = (fieldId: string, activityId: string) => {
    setState((prev) => {
      const updatedFields = prev.personalDataFields.map((f) =>
        f.id === fieldId
          ? { ...f, mappedActivityId: activityId, status: "Mapped" as const }
          : f
      );

      // Check if unmapped findings can be resolved
      const field = prev.personalDataFields.find((f) => f.id === fieldId);
      const updatedFindings = prev.findings.map((f) => {
        if (
          f.type === "UNMAPPED_DATA" &&
          field &&
          f.title.includes(field.fieldName)
        ) {
          return {
            ...f,
            status: "Resolved" as const,
            reviewedBy: "Priya Sharma (DPO)",
          };
        }
        return f;
      });

      return {
        ...prev,
        personalDataFields: updatedFields,
        findings: updatedFindings,
      };
    });
  };

  const updateRequestStatus = (requestId: string, status: RequestStatus) => {
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status,
              resolutionEvidenceHash:
                status === "Completed"
                  ? generateEvidenceHash(`req_${requestId}_completed`)
                  : r.resolutionEvidenceHash,
            }
          : r
      ),
    }));
  };

  const toggleRequestTask = (requestId: string, taskId: string) => {
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => {
        if (r.id !== requestId) return r;
        const updatedTasks = r.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: !t.completed,
                completedAt: !t.completed ? new Date().toISOString() : undefined,
              }
            : t
        );
        return { ...r, tasks: updatedTasks };
      }),
    }));
  };

  const updateIncidentObligation = (
    incidentId: string,
    obligationId: string,
    status: "Pending" | "In Preparation" | "Submitted"
  ) => {
    setState((prev) => ({
      ...prev,
      incidents: prev.incidents.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const updatedObligations = inc.obligations.map((ob) =>
          ob.id === obligationId ? { ...ob, status } : ob
        );
        return { ...inc, obligations: updatedObligations };
      }),
    }));
  };

  const resetToDemo = () => {
    const fresh = getInitialState();
    setState(fresh);
    if (typeof window !== "undefined") {
      localStorage.removeItem("complydp_state_v1");
    }
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        resolveFinding,
        approveCookieClassification,
        triggerWebsiteScan,
        triggerGitHubScan,
        approveFieldMapping,
        updateRequestStatus,
        toggleRequestTask,
        updateIncidentObligation,
        setSelectedFindingId: (id) =>
          setState((prev) => ({ ...prev, selectedFindingId: id })),
        setSelectedRequestId: (id) =>
          setState((prev) => ({ ...prev, selectedRequestId: id })),
        setSelectedIncidentId: (id) =>
          setState((prev) => ({ ...prev, selectedIncidentId: id })),
        resetToDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useComplyDP() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useComplyDP must be used within an AppProvider");
  }
  return context;
}
