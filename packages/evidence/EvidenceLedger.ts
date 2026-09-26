import crypto from "node:crypto";

/**
 * complyDP — Tamper-Evident Evidence Ledger
 * Chains cryptographic proofs to ensure compliance claims are defensible and immutable.
 */

export interface EvidenceBlock {
  index: number;
  timestamp: string;
  source: string;
  sourceType: string;
  objectType: string;
  objectId: string;
  payloadHash: string;
  previousHash: string;
  eventHash: string;
  attestedBy: string;
}

export class EvidenceLedger {
  private chain: EvidenceBlock[] = [];

  constructor() {
    // Genesis Block for AsterPay Tenant
    const genesisHash = this.computeHash(
      "0:GENESIS_BLOCK:complyDP_INDIA_DPDP_2026:0000000000000000"
    );
    this.chain.push({
      index: 0,
      timestamp: "2026-09-26T00:00:00.000Z",
      source: "SYSTEM_GENESIS",
      sourceType: "GOVERNANCE",
      objectType: "TENANT",
      objectId: "ten_in_0918",
      payloadHash: genesisHash,
      previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
      eventHash: genesisHash,
      attestedBy: "Priya Sharma (DPO)",
    });
  }

  computeHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  append(
    source: string,
    sourceType: string,
    objectType: string,
    objectId: string,
    rawPayload: unknown,
    attestedBy: string
  ): EvidenceBlock {
    const previous = this.chain[this.chain.length - 1];
    const payloadHash = this.computeHash(JSON.stringify(rawPayload));
    const timestamp = new Date().toISOString();
    const eventHash = this.computeHash(
      `${this.chain.length}:${timestamp}:${payloadHash}:${previous.eventHash}`
    );

    const block: EvidenceBlock = {
      index: this.chain.length,
      timestamp,
      source,
      sourceType,
      objectType,
      objectId,
      payloadHash,
      previousHash: previous.eventHash,
      eventHash,
      attestedBy,
    };

    this.chain.push(block);
    return block;
  }

  verifyIntegrity(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.previousHash !== previous.eventHash) {
        return false;
      }

      const calculated = this.computeHash(
        `${current.index}:${current.timestamp}:${current.payloadHash}:${current.previousHash}`
      );
      if (calculated !== current.eventHash) {
        return false;
      }
    }
    return true;
  }

  getHistory(): EvidenceBlock[] {
    return [...this.chain];
  }
}
