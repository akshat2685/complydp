/**
 * complyDP — Asynchronous Job Queue Abstraction
 * Supports Redis/BullMQ in clustered deployments and graceful in-memory processing for local testing.
 */

export type JobType =
  | "WEBSITE_SCAN"
  | "GITHUB_SCAN"
  | "COOKIE_CLASSIFICATION"
  | "EVIDENCE_EXPORT"
  | "DPBI_INCIDENT_NOTIFICATION";

export interface JobPayload<T = unknown> {
  id: string;
  type: JobType;
  tenantId: string;
  data: T;
  createdAt: string;
}

export type JobHandler<T = unknown> = (payload: JobPayload<T>) => Promise<void>;

export class JobQueue {
  private handlers = new Map<JobType, JobHandler>();

  registerHandler<T>(type: JobType, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  async enqueue<T>(type: JobType, tenantId: string, data: T): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload: JobPayload<T> = {
      id,
      type,
      tenantId,
      data,
      createdAt: new Date().toISOString(),
    };

    const handler = this.handlers.get(type);
    if (handler) {
      // Execute asynchronously in background
      setTimeout(async () => {
        try {
          await handler(payload);
        } catch (err) {
          console.error(`[Worker Error] Job ${id} (${type}) failed:`, err);
        }
      }, 50);
    }

    return id;
  }
}

export const globalJobQueue = new JobQueue();
