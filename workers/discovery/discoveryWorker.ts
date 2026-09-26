import { globalJobQueue, JobPayload } from "../queue";
import { WebsiteScanner, GitHubScanner, NormalizedFinding } from "../../packages/scanner/Scanner";

export interface ScanJobData {
  scanId: string;
  target: string;
  scannerType: "WEBSITE" | "GITHUB";
}

export async function processDiscoveryScanJob(payload: JobPayload<ScanJobData>): Promise<void> {
  const { scanId, target, scannerType } = payload.data;
  console.log(`[Discovery Worker] Starting ${scannerType} scan for target: ${target} (Job: ${payload.id})`);

  let findings: NormalizedFinding[] = [];
  if (scannerType === "WEBSITE") {
    const scanner = new WebsiteScanner();
    findings = await scanner.scan(target);
  } else if (scannerType === "GITHUB") {
    const scanner = new GitHubScanner();
    findings = await scanner.scan(target);
  }

  console.log(
    `[Discovery Worker] Scan ${scanId} completed. ${findings.length} normalized finding(s) emitted with cryptographic evidence seals.`
  );
}

// Register handler
globalJobQueue.registerHandler<ScanJobData>("WEBSITE_SCAN", processDiscoveryScanJob);
globalJobQueue.registerHandler<ScanJobData>("GITHUB_SCAN", processDiscoveryScanJob);
