"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card, CardTitle } from "@/components/ui";

export function InstallTab({ snippetUrl }: { snippetUrl: string }) {
  const [copied, setCopied] = useState(false);
  const tag = `<script src="${snippetUrl}" defer></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(tag);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = tag;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 space-y-5">
        <Card>
          <CardTitle>One line, before &lt;/head&gt;</CardTitle>
          <p className="text-[13px] text-ink-muted mb-3">
            Paste this on every page of your site. The banner fetches your live
            configuration, asks the age question when age-gating is on, and
            records each choice as a hash-chained consent event.
          </p>
          <div className="relative">
            <pre className="font-mono text-[12px] bg-ink text-paper rounded-md p-4 pr-12 overflow-x-auto whitespace-pre-wrap break-all">
              {tag}
            </pre>
            <button
              onClick={copy}
              className="absolute top-2.5 right-2.5 btn btn-sm bg-paper text-ink hover:bg-white"
              aria-label="Copy snippet"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </Card>

        <Card>
          <CardTitle>What the banner does</CardTitle>
          <ol className="space-y-3 text-[13px]">
            {[
              ["Loads your live config", "On every page view it GETs /api/consent/config, so banner text you change in the Configure tab takes effect without redeploying your site."],
              ["Asks the age question", "When age-gating is on, visitors first answer \u201cAre you 18 or older?\u201d Under-18s get strictly necessary cookies only, recorded as age_band=under18."],
              ["Records proof, not just a click", "Each choice is POSTed to /api/consent/events and hash-chained: every event embeds the hash of the previous one. Tampering breaks the chain."],
            ].map(([title, body], i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 h-5 shrink-0 rounded-full bg-ink text-paper font-mono text-[10.5px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <div className="font-bold text-ink">{title}</div>
                  <div className="text-ink-muted mt-0.5">{body}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardTitle>Live preview</CardTitle>
          <p className="text-[12px] text-ink-muted mb-3">
            This is the banner your visitors see — rendered here from the same
            configuration the snippet fetches.
          </p>
          <BannerPreview />
          <p className="text-[11.5px] text-ink-faint mt-3 font-mono">
            Preview only — choices made here are not recorded.
          </p>
        </Card>
      </div>
    </div>
  );
}

function BannerPreview() {
  const [custom, setCustom] = useState(false);
  const [cats, setCats] = useState({ functional: false, analytics: false, marketing: false });
  return (
    <div className="border border-hairline-strong rounded-md bg-paper-panel p-4 shadow-card text-[13px]">
      <div className="font-display text-[16px] font-bold mb-1.5">We value your privacy</div>
      <p className="text-ink-muted mb-3 text-[12.5px]">
        Meridian Foods uses cookies to run the store, remember your cart and — with
        your permission — measure and personalise.
      </p>
      {custom && (
        <div className="border-t border-dashed border-hairline py-2.5 mb-1 space-y-2">
          {(["functional", "analytics", "marketing"] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer text-[12.5px]">
              <input
                type="checkbox"
                checked={cats[k]}
                onChange={(e) => setCats({ ...cats, [k]: e.target.checked })}
                className="accent-[#a33327]"
              />
              <span className="capitalize font-semibold">{k}</span>
            </label>
          ))}
          <div className="text-[11px] text-ink-faint">Strictly necessary is always on.</div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-seal btn-sm" type="button">Accept all</button>
        <button className="btn btn-line btn-sm" type="button">Reject non-essential</button>
        <button className="btn btn-line btn-sm" type="button" onClick={() => setCustom(!custom)}>
          {custom ? "Hide choices" : "Customise"}
        </button>
      </div>
    </div>
  );
}
