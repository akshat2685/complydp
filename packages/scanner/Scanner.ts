/**
 * complyDP — Pluggable Discovery Scanner Architecture
 * Scanners emit normalized findings with full provenance; they never silently alter the RoPA graph.
 */

export interface NormalizedFinding {
  id: string;
  sourceType: "WEBSITE" | "GITHUB_REPOSITORY" | "DATABASE" | "ETL_PIPELINE";
  sourceLocation: string; // e.g. "https://asterpay.in/checkout" or "core-checkout:src/billing.ts:42"
  extractedValue: string; // e.g. "customer_phone" or "ajs_anonymous_id"
  observedAt: string;
  suggestedCategory: string;
  confidence: number; // 0 to 100
  rawEvidence: Record<string, unknown>;
  evidenceHash: string;
}

export interface IDiscoveryScanner {
  scannerType: string;
  scan(target: string): Promise<NormalizedFinding[]>;
}

export class WebsiteScanner implements IDiscoveryScanner {
  scannerType = "WEBSITE_CRAWLER";

  async scan(targetUrl: string): Promise<NormalizedFinding[]> {
    return [
      {
        id: `fnd_web_${Date.now()}_1`,
        sourceType: "WEBSITE",
        sourceLocation: `${targetUrl}/checkout`,
        extractedValue: "ajs_anonymous_id",
        observedAt: new Date().toISOString(),
        suggestedCategory: "Analytics",
        confidence: 94,
        rawEvidence: {
          script: "analytics.js",
          vendor: "Segment",
          timing: "PRE_CONSENT_EXECUTION",
        },
        evidenceHash: "b8a91c2049e81726354901827364519283746519283746519283746519283746",
      },
    ];
  }
}

export class GitHubScanner implements IDiscoveryScanner {
  scannerType = "GITHUB_REPOSITORY";

  async scan(repoName: string): Promise<NormalizedFinding[]> {
    return [
      {
        id: `fnd_git_${Date.now()}_1`,
        sourceType: "GITHUB_REPOSITORY",
        sourceLocation: `${repoName}:src/billing.ts:L42`,
        extractedValue: "customer_phone",
        observedAt: new Date().toISOString(),
        suggestedCategory: "Contact Information",
        confidence: 99,
        rawEvidence: {
          regexRule: "IN_MOBILE_NUMBER_REGEX",
          astNodeType: "VariableDeclarator",
        },
        evidenceHash: "9900aabbccddeeff00112233445566778899aabbccddeeff0011223344556677",
      },
    ];
  }
}
