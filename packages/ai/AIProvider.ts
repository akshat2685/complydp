/**
 * complyDP — AI Provider Abstraction
 * Enforces human-in-the-loop review, strict provenance, and model isolation.
 */

export type AITaskType =
  | "CLASSIFY_DATA_TOKEN"
  | "CLASSIFY_COOKIE"
  | "INFER_VENDOR"
  | "SUGGEST_ROPA_MAPPING"
  | "SUMMARIZE_INCIDENT_IMPACT";

export type AIReviewStatus = "SUGGESTED" | "ACCEPTED" | "REJECTED" | "MODIFIED";

export interface AIResult<T = unknown> {
  id: string;
  taskType: AITaskType;
  inputReference: string;
  model: string;
  modelVersion: string;
  output: T;
  confidence: number; // 0 to 100
  createdAt: string;
  evidenceReferences: string[];
  reviewStatus: AIReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface AIClassificationInput {
  tokenName: string;
  sourceContext: string;
  surroundingTokens?: string[];
}

export interface AIClassificationOutput {
  suggestedCategory: string;
  sensitivity: "High" | "Medium" | "Normal";
  suggestedActivity: string;
  legalBasis: string;
  reasoning: string;
}

export interface IAIProvider {
  name: string;
  classifyPersonalData(
    input: AIClassificationInput
  ): Promise<AIResult<AIClassificationOutput>>;
}

/**
 * Deterministic Mock / Offline Provider for Reliable Testing and Controlled Deployments
 */
export class DeterministicAIProvider implements IAIProvider {
  name = "Deterministic-DPDP-Engine-v2";

  async classifyPersonalData(
    input: AIClassificationInput
  ): Promise<AIResult<AIClassificationOutput>> {
    const token = input.tokenName.toLowerCase();

    let output: AIClassificationOutput = {
      suggestedCategory: "General Identifiers",
      sensitivity: "Normal",
      suggestedActivity: "Customer Onboarding & KYC",
      legalBasis: "Certain Legitimate Uses (DPDP S.7)",
      reasoning: "General user telemetry or session token.",
    };

    if (token.includes("phone") || token.includes("mobile")) {
      output = {
        suggestedCategory: "Contact Information",
        sensitivity: "High",
        suggestedActivity: "Customer Onboarding & KYC",
        legalBasis: "Legal Obligation (RBI / DPDP)",
        reasoning: "Indian 10-digit mobile number used as primary identity anchor.",
      };
    } else if (token.includes("pan") || token.includes("tax")) {
      output = {
        suggestedCategory: "Government Identifier",
        sensitivity: "High",
        suggestedActivity: "Customer Onboarding & KYC",
        legalBasis: "Legal Obligation (PMLA / Income Tax Act)",
        reasoning: "Permanent Account Number subject to strict purpose limitation.",
      };
    } else if (token.includes("email")) {
      output = {
        suggestedCategory: "Contact Information",
        sensitivity: "Medium",
        suggestedActivity: "Customer Onboarding & KYC",
        legalBasis: "Consent",
        reasoning: "Direct communication channel for notices and transaction receipts.",
      };
    }

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      taskType: "CLASSIFY_DATA_TOKEN",
      inputReference: `${input.sourceContext}:${input.tokenName}`,
      model: this.name,
      modelVersion: "2026.04",
      output,
      confidence: 96,
      createdAt: new Date().toISOString(),
      evidenceReferences: [`ev_ast_${Date.now()}`],
      reviewStatus: "SUGGESTED",
    };
  }
}
