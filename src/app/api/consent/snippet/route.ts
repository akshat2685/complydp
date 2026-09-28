import { NextResponse } from "next/server";
import { cors, corsPreflight } from "@/server/api";

/**
 * GET /api/consent/snippet — the installable consent banner.
 *
 * Served as real JavaScript so sites embed one line:
 *   <script src="https://<pramaan-host>/api/consent/snippet" defer></script>
 *
 * At runtime it pulls live banner config from /api/consent/config, renders
 * the banner, enforces age-gating, and POSTs each choice to
 * /api/consent/events where it is hash-chained into the consent log.
 */
export async function OPTIONS() {
  return corsPreflight();
}

const SNIPPET = `(function () {
  "use strict";
  var scriptEl = document.currentScript;
  var BASE = scriptEl ? new URL(scriptEl.src).origin : window.location.origin;
  var VID_KEY = "pramaan_vid", DONE_KEY = "pramaan_done";

  function vid() {
    try {
      var v = localStorage.getItem(VID_KEY);
      if (!v) { v = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(VID_KEY, v); }
      return v;
    } catch (e) { return "v_" + Math.random().toString(36).slice(2); }
  }
  function done() { try { localStorage.setItem(DONE_KEY, "1"); } catch (e) {} }
  function seen() { try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return false; } }

  function post(ageBand, categories, noticeVersion) {
    fetch(BASE + "/api/consent/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_hash: vid(), age_band: ageBand, categories: categories, consent_mode: "banner", notice_version: noticeVersion || "" })
    }).catch(function () {});
  }

  function css() {
    return "position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483647;" +
      "background:#fffdf8;color:#1c1a17;border:1px solid #d3cbb6;border-radius:8px;" +
      "box-shadow:0 8px 30px rgba(28,26,23,.18);padding:18px 20px;max-width:640px;margin:0 auto;" +
      "font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:13px;line-height:1.5;";
  }

  function render(banner, settings) {
    if (seen()) return;
    var box = document.createElement("div");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Cookie consent");
    box.style.cssText = css();

    var h = '<div style="font-family:Georgia,serif;font-size:17px;font-weight:bold;margin-bottom:6px;">' + esc(banner.title) + "</div>" +
      '<div style="color:#6f675c;margin-bottom:12px;">' + esc(banner.text) + "</div>";

    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

    function finish(ageBand, cats) { post(ageBand, cats, settings.notice_version); done(); box.remove(); }

    if (settings.age_gating && !box.dataset.agedone) {
      // Step 1: age check
      box.innerHTML = h +
        '<div style="font-weight:600;margin-bottom:8px;">Are you 18 or older?</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button data-a="yes" style="' + btn("#1c1a17", "#f6f4ee") + '">Yes, I am 18+</button>' +
        '<button data-a="no" style="' + btn("#fffdf8", "#1c1a17") + '">No, under 18</button></div>' +
        '<div style="font-size:11px;color:#a39e93;margin-top:8px;">Under-18 visitors get strictly necessary cookies only.</div>';
      box.querySelector('[data-a="yes"]').onclick = function () { box.dataset.agedone = "1"; showChoices("adult"); };
      box.querySelector('[data-a="no"]').onclick = function () {
        finish("under18", { necessary: true, functional: false, analytics: false, marketing: false });
      };
    } else {
      showChoices("adult");
    }

    function showChoices(ageBand) {
      box.innerHTML = h +
        '<div id="pm-toggles" style="display:none;border-top:1px dashed #e5dfd2;margin:10px 0;padding-top:10px;">' +
        toggle("functional", "Functional", "Remembers preferences like language.") +
        toggle("analytics", "Analytics", "Helps us understand store usage.") +
        toggle("marketing", "Marketing", "Personalised offers and ad measurement.") +
        '<div style="font-size:11px;color:#a39e93;">Strictly necessary cookies are always on — the site cannot run without them.</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">' +
        '<button data-c="accept" style="' + btn("#a33327", "#fff") + '">' + esc(banner.accept_label) + "</button>" +
        '<button data-c="reject" style="' + btn("#fffdf8", "#1c1a17") + '">' + esc(banner.reject_label) + "</button>" +
        '<button data-c="custom" style="' + btn("#fffdf8", "#1c1a17") + '">' + esc(banner.customize_label) + "</button></div>";

      box.querySelector('[data-c="accept"]').onclick = function () {
        finish(ageBand, { necessary: true, functional: true, analytics: true, marketing: true });
      };
      box.querySelector('[data-c="reject"]').onclick = function () {
        finish(ageBand, { necessary: true, functional: false, analytics: false, marketing: false });
      };
      var custom = box.querySelector('[data-c="custom"]');
      custom.onclick = function () {
        var t = box.querySelector("#pm-toggles");
        var open = t.style.display !== "none";
        t.style.display = open ? "none" : "block";
        custom.textContent = open ? banner.customize_label : "Save choices";
        if (open) {
          finish(ageBand, {
            necessary: true,
            functional: box.querySelector('[data-t="functional"]').checked,
            analytics: box.querySelector('[data-t="analytics"]').checked,
            marketing: box.querySelector('[data-t="marketing"]').checked
          });
        }
      };
    }

    function toggle(key, label, hint) {
      return '<label style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;cursor:pointer;">' +
        '<input type="checkbox" data-t="' + key + '" style="margin-top:3px;">' +
        '<span><span style="font-weight:600;">' + label + '</span><br><span style="color:#6f675c;font-size:12px;">' + hint + "</span></span></label>";
    }
    function btn(bg, fg) {
      return "background:" + bg + ";color:" + fg + ";border:1px solid #d3cbb6;border-radius:4px;" +
        "padding:8px 14px;font-size:12.5px;font-weight:600;cursor:pointer;";
    }

    document.body.appendChild(box);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }

  function init() {
    fetch(BASE + "/api/consent/config")
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        var s = (cfg.tenant && cfg.tenant.settings) || {};
        render(s.banner || { title: "We value your privacy", text: "", accept_label: "Accept all", reject_label: "Reject non-essential", customize_label: "Customise" }, s);
      })
      .catch(function () {});
  }
})();`;

export async function GET() {
  const res = new NextResponse(SNIPPET, {
    status: 200,
    headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
  return cors(res);
}
