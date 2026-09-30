"use client";

import { useCallback, useEffect, useState } from "react";
import { Chip } from "@/components/ui";

interface NotificationsConfig {
  notifications: {
    resend_api_key: string;
    resend_from: string;
    resend_base_url: string;
    whatsapp_webhook_url: string;
    whatsapp_bearer: string;
  };
  masked: { resend_api_key: string; whatsapp_bearer: string };
  configured: { email: boolean; whatsapp: boolean };
}

const REFRESH_EVENT = "pramaan:notifications-updated";

async function loadConfig(): Promise<NotificationsConfig | null> {
  try {
    const res = await fetch("/api/admin/notifications");
    if (!res.ok) return null;
    return (await res.json()) as NotificationsConfig;
  } catch {
    return null;
  }
}

/** Dynamic card chip — teal "configured" when any provider is set, amber otherwise. */
export function NotificationChip() {
  const [configured, setConfigured] = useState<{ email: boolean; whatsapp: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    const refresh = () => loadConfig().then((c) => alive && setConfigured(c?.configured ?? null));
    refresh();
    window.addEventListener(REFRESH_EVENT, refresh);
    return () => {
      alive = false;
      window.removeEventListener(REFRESH_EVENT, refresh);
    };
  }, []);

  const any = configured ? configured.email || configured.whatsapp : false;
  if (configured === null) return <Chip tone="mute">loading</Chip>;
  return any ? <Chip tone="teal">configured</Chip> : <Chip tone="amber">not configured</Chip>;
}

const initial: NotificationsConfig["notifications"] = {
  resend_api_key: "",
  resend_from: "",
  resend_base_url: "",
  whatsapp_webhook_url: "",
  whatsapp_bearer: "",
};

/** Working form for the notification provider settings. Secrets stay masked. */
export function NotificationSettings() {
  const [masked, setMasked] = useState({ resend_api_key: "", whatsapp_bearer: "" });
  const [form, setForm] = useState(initial);
  const [clearResendKey, setClearResendKey] = useState(false);
  const [clearWhatsappBearer, setClearWhatsappBearer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const refresh = useCallback(async () => {
    const c = await loadConfig();
    if (!c) return;
    setForm({ ...initial, resend_from: c.notifications.resend_from, resend_base_url: c.notifications.resend_base_url, whatsapp_webhook_url: c.notifications.whatsapp_webhook_url });
    setMasked(c.masked);
    setClearResendKey(false);
    setClearWhatsappBearer(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function save() {
    setSaving(true);
    setSaved(null);
    setError(null);
    try {
      const payload: Record<string, string> = {
        resend_from: form.resend_from.trim(),
        resend_base_url: form.resend_base_url.trim(),
        whatsapp_webhook_url: form.whatsapp_webhook_url.trim(),
      };
      // Secret fields: only send when the user typed a new value or explicitly cleared.
      if (clearResendKey) payload.resend_api_key = "";
      else if (form.resend_api_key) payload.resend_api_key = form.resend_api_key.trim();
      if (clearWhatsappBearer) payload.whatsapp_bearer = "";
      else if (form.whatsapp_bearer) payload.whatsapp_bearer = form.whatsapp_bearer.trim();

      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Save failed.");
        return;
      }
      setForm((f) => ({ ...f, resend_api_key: "", whatsapp_bearer: "" }));
      setSaved("Saved — the card chip above updates once a provider is detected.");
      window.dispatchEvent(new Event(REFRESH_EVENT));
      await refresh();
    } catch {
      setError("Save failed — the server could not be reached.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-ink-muted">
        Connect a real sender once, and breach notifications go out for real. Until a provider
        is configured, notifications are{" "}
        <span className="font-semibold text-ink">logged as evidence only</span>.
      </p>

      <div className="space-y-3">
        <div className="border border-hairline rounded-md p-3">
          <p className="kicker mb-2">Email — Resend</p>
          <label className="kicker block mb-1.5">Resend API key</label>
          <input
            className="field"
            type="password"
            placeholder={masked.resend_api_key ? `current: ${masked.resend_api_key} (leave empty to keep)` : "re_… (leave empty to keep)"}
            value={form.resend_api_key}
            onChange={set("resend_api_key")}
            disabled={clearResendKey}
          />
          <label className="flex items-center gap-2 mt-1.5 text-[11.5px] text-ink-muted">
            <input
              type="checkbox"
              checked={clearResendKey}
              onChange={(e) => setClearResendKey(e.target.checked)}
            />
            Clear the stored key
          </label>
          <label className="kicker block mb-1.5 mt-3">Sender identity</label>
          <input
            className="field"
            placeholder="dpo@yourcompany.com"
            value={form.resend_from}
            onChange={set("resend_from")}
          />
          <label className="kicker block mb-1.5 mt-3">Resend base URL <span className="text-ink-faint normal-case">(optional)</span></label>
          <input
            className="field font-mono"
            placeholder="https://api.resend.com"
            value={form.resend_base_url}
            onChange={set("resend_base_url")}
          />
          <p className="text-[11px] text-ink-faint mt-1">
            Override this only to point at a test double — defaults to https://api.resend.com.
          </p>
        </div>

        <div className="border border-hairline rounded-md p-3">
          <p className="kicker mb-2">WhatsApp — webhook</p>
          <label className="kicker block mb-1.5">Webhook URL</label>
          <input
            className="field font-mono"
            placeholder="https://provider.example/v1/messages"
            value={form.whatsapp_webhook_url}
            onChange={set("whatsapp_webhook_url")}
          />
          <label className="kicker block mb-1.5 mt-3">Bearer token</label>
          <input
            className="field"
            type="password"
            placeholder={masked.whatsapp_bearer ? `current: ${masked.whatsapp_bearer} (leave empty to keep)` : "leave empty to keep"}
            value={form.whatsapp_bearer}
            onChange={set("whatsapp_bearer")}
            disabled={clearWhatsappBearer}
          />
          <label className="flex items-center gap-2 mt-1.5 text-[11.5px] text-ink-muted">
            <input
              type="checkbox"
              checked={clearWhatsappBearer}
              onChange={(e) => setClearWhatsappBearer(e.target.checked)}
            />
            Clear the stored token
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn btn-seal btn-sm">
          {saving ? "Saving…" : "Save notification settings"}
        </button>
        {saved && <p className="text-[12px] text-teal-dark">{saved}</p>}
        {error && <p className="text-[12px] text-status-red">{error}</p>}
      </div>

      <p className="text-[11.5px] text-ink-faint">
        Keys are stored in the tenant settings and never shown back in full — only masked
        previews. Saving writes an evidence-ledger entry.
      </p>
    </div>
  );
}
