/**
 * Real notification sending — Resend (email) + a generic WhatsApp webhook.
 *
 * Server-only. Credentials live in tenant.settings_json for 'tenant_meridian'
 * (read-modify-write; never commit secrets anywhere else). Nothing here is
 * mocked: if a provider is not configured, senders honestly report
 * "not_configured" and callers keep the log-only evidence behaviour.
 */
import { qOne, parseJson } from "@/server/api";

export interface NotifyConfig {
  resendApiKey: string;
  resendFrom: string;
  resendBaseUrl: string;
  whatsappWebhookUrl: string;
  whatsappBearer: string;
}

export interface SendResult {
  ok: boolean;
  status: "sent" | "not_configured" | "failed";
  provider_id?: string;
  error?: string;
}

const DEFAULT_RESEND_BASE_URL = "https://api.resend.com";
const TENANT_ID = "tenant_meridian";

interface NotifySettings {
  resend_api_key?: string;
  resend_from?: string;
  resend_base_url?: string;
  whatsapp_webhook_url?: string;
  whatsapp_bearer?: string;
}

/** Read notification settings from tenant.settings_json (nested "notifications" key). */
async function readNotifySettings(): Promise<NotifySettings> {
  const row = await qOne<{ settings_json: string }>("SELECT settings_json FROM tenant WHERE id = ?", TENANT_ID);
  if (!row) return {};
  const settings = parseJson<Record<string, unknown>>(row.settings_json, {});
  const n = settings["notifications"];
  return n && typeof n === "object" ? (n as NotifySettings) : {};
}

/** Mask a secret for display: "re_abc…wxyz" style — never the full value. */
export function maskSecret(raw: string): string {
  const s = raw.trim();
  if (s.length <= 8) return "****";
  return `${s.slice(0, 3)}****${s.slice(-4)}`;
}

export async function getNotifyConfig(): Promise<NotifyConfig> {
  const s = await readNotifySettings();
  const base = (s.resend_base_url ?? "").trim();
  return {
    resendApiKey: (s.resend_api_key ?? "").trim(),
    resendFrom: (s.resend_from ?? "").trim(),
    resendBaseUrl: base || DEFAULT_RESEND_BASE_URL,
    whatsappWebhookUrl: (s.whatsapp_webhook_url ?? "").trim(),
    whatsappBearer: (s.whatsapp_bearer ?? "").trim(),
  };
}

/** Overall sender status for UI/API surfaces. */
export async function getSenderStatus(): Promise<string> {
  const c = await getNotifyConfig();
  const parts: string[] = [];
  if (c.resendApiKey) parts.push("configured (resend)");
  if (c.whatsappWebhookUrl) parts.push("configured (whatsapp)");
  return parts.length > 0 ? parts.join(" · ") : "not_configured — notifications are logged as evidence only";
}

async function postJson(url: string, payload: unknown, bearer?: string): Promise<{ status: number; json: unknown; text: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

function extractId(json: unknown, text: string): { id?: string } {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    for (const key of ["id", "message_id", "provider_id", "response_id"]) {
      const v = o[key];
      if (typeof v === "string" && v.length > 0) return { id: v };
    }
  }
  return text.length > 0 ? { id: undefined } : {};
}

/** Send an email via Resend. Honest "not_configured" when no API key is set. */
export async function sendEmail(to: string, subject: string, bodyText: string): Promise<SendResult> {
  const cfg = await getNotifyConfig();
  if (!cfg.resendApiKey) return { ok: false, status: "not_configured" };
  if (!cfg.resendFrom) return { ok: false, status: "failed", error: "Resend sender identity is not set." };
  const url = cfg.resendBaseUrl.replace(/\/$/, "") + "/emails";
  try {
    const r = await postJson(url, { from: cfg.resendFrom, to: [to], subject, text: bodyText }, cfg.resendApiKey);
    if (r.status < 200 || r.status >= 300) {
      return { ok: false, status: "failed", error: `Resend error ${r.status}: ${r.text.slice(0, 200)}` };
    }
    const { id } = extractId(r.json, r.text);
    return { ok: true, status: "sent", provider_id: id };
  } catch (e) {
    return { ok: false, status: "failed", error: e instanceof Error ? e.message : "unknown send error" };
  }
}

/** Send a WhatsApp message via the configured webhook. Honest "not_configured" when no URL is set. */
export async function sendWhatsApp(to: string, bodyText: string): Promise<SendResult> {
  const cfg = await getNotifyConfig();
  if (!cfg.whatsappWebhookUrl) return { ok: false, status: "not_configured" };
  try {
    const r = await postJson(cfg.whatsappWebhookUrl, { to, message: bodyText }, cfg.whatsappBearer || undefined);
    if (r.status < 200 || r.status >= 300) {
      return { ok: false, status: "failed", error: `WhatsApp webhook error ${r.status}: ${r.text.slice(0, 200)}` };
    }
    const { id } = extractId(r.json, r.text);
    return { ok: true, status: "sent", provider_id: id };
  } catch (e) {
    return { ok: false, status: "failed", error: e instanceof Error ? e.message : "unknown send error" };
  }
}

