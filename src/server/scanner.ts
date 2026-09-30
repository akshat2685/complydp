/**
 * Real website cookie scanner.
 *
 * Fetches pages server-side (no headless browser — static scan), collects
 * Set-Cookie headers + script tags, and classifies cookies with keyword rules.
 * Honest limitation, shown in the UI: JavaScript-set cookies that only appear
 * after client-side execution are NOT captured by a static scan.
 */

export interface ScannedCookie {
  name: string;
  category: "necessary" | "functional" | "analytics" | "marketing" | "unclassified";
  vendor_hint: string;
  duration: string;
  evidence: string; // where it was seen, e.g. "Set-Cookie header on /"
}

export interface ScanResult {
  ok: boolean;
  url: string;
  pages_crawled: number;
  cookies: ScannedCookie[];
  third_party_domains: string[];
  error?: string;
  note: string;
}

const TRACKER_DOMAINS: Array<[RegExp, string, string]> = [
  [/googletagmanager\.com|google-analytics\.com/i, "Google", "analytics"],
  [/facebook\.net|fbsbx\.com/i, "Meta", "marketing"],
  [/doubleclick\.net|googlesyndication\.com/i, "Google", "marketing"],
  [/hotjar\.com/i, "Hotjar", "analytics"],
  [/mixpanel\.com/i, "Mixpanel", "analytics"],
  [/segment\.(com|io)/i, "Segment", "analytics"],
  [/intercom/i, "Intercom", "functional"],
  [/freshdesk|freshworks/i, "Freshworks", "functional"],
  [/razorpay/i, "Razorpay", "necessary"],
  [/stripe/i, "Stripe", "necessary"],
  [/cloudflare/i, "Cloudflare", "necessary"],
  [/clarity\.ms/i, "Microsoft", "analytics"],
  [/tiktok/i, "TikTok", "marketing"],
  [/linkedin\.com\/insight/i, "LinkedIn", "marketing"],
  [/criteo/i, "Criteo", "marketing"],
];

const COOKIE_RULES: Array<[RegExp, ScannedCookie["category"], string]> = [
  [/^(_ga|_gid|_gat|_gac|ajs_|mp_|_mixpanel|amplitude|_hj)/i, "analytics", "Analytics"],
  [/^(_fbp|_fbc|_gcl|_gac_|fr$|tr$|_uetsid|_uetvid|li_|_li_|ads_|IDE|_criteo)/i, "marketing", "Advertising"],
  [/session|cart|basket|checkout|csrf|xsrf|auth|token|consent|cookie[_-]?banner|notice/i, "necessary", "Site operation"],
  [/pref|lang|locale|theme|currency|ab_|experiment|variant/i, "functional", "Preferences"],
  [/cf_|__cf|incap_|_abck|ak_bmsc/i, "necessary", "Security"],
];

function classifyCookie(name: string): { category: ScannedCookie["category"]; vendor_hint: string } {
  for (const [re, cat, vendor] of COOKIE_RULES) {
    if (re.test(name)) return { category: cat, vendor_hint: vendor };
  }
  return { category: "unclassified", vendor_hint: "" };
}

function parseSetCookie(headers: Headers): Array<{ name: string; attrs: string }> {
  const out: Array<{ name: string; attrs: string }> = [];
  // undici combines set-cookie with ", " — split carefully on known pattern.
  const raw = headers.getSetCookie ? headers.getSetCookie() : [];
  for (const c of raw) {
    const semi = c.indexOf(";");
    const pair = semi === -1 ? c : c.slice(0, semi);
    const eq = pair.indexOf("=");
    if (eq > 0) out.push({ name: pair.slice(0, eq).trim(), attrs: c.slice(semi + 1) });
  }
  return out;
}

function durationFromAttrs(attrs: string): string {
  const m = attrs.match(/Max-Age=(\d+)/i);
  if (m) {
    const s = parseInt(m[1], 10);
    if (s <= 0) return "Session";
    if (s < 3600) return `${Math.round(s / 60)} minutes`;
    if (s < 86400) return `${Math.round(s / 3600)} hours`;
    if (s < 86400 * 365) return `${Math.round(s / 86400)} days`;
    return `${(s / (86400 * 365)).toFixed(1)} years`;
  }
  if (/expires=/i.test(attrs)) return "Persistent";
  return "Session";
}

function sameOriginLinks(html: string, base: URL, limit: number): string[] {
  const links = new Set<string>();
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && links.size < limit) {
    try {
      const u = new URL(m[1], base);
      if (u.origin === base.origin && !u.pathname.match(/\.(pdf|jpg|png|zip)$/i)) {
        links.add(u.toString());
      }
    } catch { /* ignore bad urls */ }
  }
  return [...links];
}

export async function scanWebsite(startUrl: string, maxPages = 6): Promise<ScanResult> {
  const note =
    "Static scan: fetches HTML server-side without executing JavaScript. Cookies set only by client-side scripts may be missed.";
  let base: URL;
  try {
    base = new URL(startUrl.startsWith("http") ? startUrl : `https://${startUrl}`);
  } catch {
    return { ok: false, url: startUrl, pages_crawled: 0, cookies: [], third_party_domains: [], error: "Invalid URL", note };
  }

  const seenCookies = new Map<string, ScannedCookie>();
  const thirdParties = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [base.toString()];
  let pages = 0;

  while (queue.length > 0 && pages < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    let res: Response;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      res = await fetch(url, {
        signal: ctrl.signal,
        redirect: "follow",
        headers: { "User-Agent": "PramaanBot/1.0 (+cookie-scan; contact: dpo)" },
      });
      clearTimeout(t);
    } catch (e) {
      if (pages === 0) {
        return {
          ok: false, url: base.toString(), pages_crawled: 0, cookies: [], third_party_domains: [],
          error: e instanceof Error ? `Fetch failed: ${e.message}` : "Fetch failed", note,
        };
      }
      continue;
    }
    pages++;

    for (const { name, attrs } of parseSetCookie(res.headers)) {
      if (!seenCookies.has(name)) {
        const c = classifyCookie(name);
        seenCookies.set(name, {
          name,
          category: c.category,
          vendor_hint: c.vendor_hint,
          duration: durationFromAttrs(attrs),
          evidence: `Set-Cookie header on ${new URL(url).pathname || "/"}`,
        });
      }
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html")) {
      const html = await res.text();
      // script tags → third-party domains
      const scriptRe = /<script[^>]+src=["']([^"']+)["']/gi;
      let sm: RegExpExecArray | null;
      while ((sm = scriptRe.exec(html))) {
        try {
          const su = new URL(sm[1], url);
          if (su.origin !== base.origin) {
            thirdParties.add(su.hostname);
            for (const [re, vendor, kind] of TRACKER_DOMAINS) {
              if (re.test(su.hostname) || re.test(sm[1])) {
                const key = `__tracker:${vendor}`;
                if (!seenCookies.has(key)) {
                  seenCookies.set(key, {
                    name: `${vendor} tracker (${kind})`,
                    category: kind as ScannedCookie["category"],
                    vendor_hint: vendor,
                    duration: "—",
                    evidence: `Script tag on ${new URL(url).pathname || "/"}: ${su.hostname}${su.pathname}`,
                  });
                }
              }
            }
          }
        } catch { /* ignore */ }
      }
      // document.cookie assignments in inline scripts
      const inlineRe = /document\.cookie\s*=\s*["']([^"';=]+)=/gi;
      let im: RegExpExecArray | null;
      while ((im = inlineRe.exec(html))) {
        const nm = im[1].trim();
        if (nm && !seenCookies.has(nm)) {
          const c = classifyCookie(nm);
          seenCookies.set(nm, {
            name: nm,
            category: c.category,
            vendor_hint: c.vendor_hint || "Inline script",
            duration: "Unknown",
            evidence: `document.cookie assignment on ${new URL(url).pathname || "/"}`,
          });
        }
      }
      if (pages === 1) {
        for (const l of sameOriginLinks(html, base, 10)) {
          if (!visited.has(l)) queue.push(l);
        }
      }
    }
  }

  const cookies = [...seenCookies.values()].filter((c) => !c.name.startsWith("__tracker:"));
  return {
    ok: true,
    url: base.toString(),
    pages_crawled: pages,
    cookies,
    third_party_domains: [...thirdParties].sort(),
    note,
  };
}
