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

  function render(banner, settings, propertyId) {
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
      box.querySelector('[data-a="no"]').onclick = function () { showGuardianStep(); };
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

    // Under-18 flow: collect parent/guardian info FIRST, then finish with
    // necessary-only consent. "Skip for now" finishes without a guardian record.
    function showGuardianStep() {
      box.innerHTML = h +
        '<div style="font-weight:600;margin-bottom:4px;">A parent or guardian must consent</div>' +
        '<div style="color:#6f675c;font-size:12px;margin-bottom:10px;">Under-18 visitors get strictly necessary cookies only, and only after a parent or guardian consents.</div>' +
        '<div style="margin-bottom:8px;"><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">Guardian name</label>' +
        '<input data-g="name" type="text" autocomplete="name" placeholder="Full name" style="' + field() + '"></div>' +
        '<div style="margin-bottom:8px;"><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">Relationship</label>' +
        '<select data-g="rel" style="' + field() + '"><option>Parent</option><option>Guardian</option><option>Other</option></select></div>' +
        '<div style="margin-bottom:8px;"><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">Contact (email or phone)</label>' +
        '<input data-g="contact" type="text" autocomplete="email" placeholder="So the site can reach you about your child&apos;s data" style="' + field() + '"></div>' +
        '<label style="display:flex;gap:8px;align-items:flex-start;margin:10px 0;cursor:pointer;">' +
        '<input data-g="consent" type="checkbox" style="margin-top:3px;">' +
        '<span style="font-size:12px;">I am the parent/guardian and consent to strictly-necessary processing.</span></label>' +
        '<div data-g="err" style="display:none;color:#a33327;font-size:12px;margin-bottom:8px;"></div>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
        '<button data-g="submit" style="' + btn("#1c1a17", "#f6f4ee") + '">Submit consent</button>' +
        '<a data-g="skip" href="#" style="font-size:12px;color:#6f675c;">Skip for now</a></div>';
      var submit = box.querySelector('[data-g="submit"]');
      var skip = box.querySelector('[data-g="skip"]');
      var err = box.querySelector('[data-g="err"]');
      function fail(m) { err.textContent = m; err.style.display = "block"; }
      function under18Necessary() { return { necessary: true, functional: false, analytics: false, marketing: false }; }
      submit.onclick = function () {
        err.style.display = "none";
        var name = box.querySelector('[data-g="name"]').value.trim();
        var rel = box.querySelector('[data-g="rel"]').value;
        var contact = box.querySelector('[data-g="contact"]').value.trim();
        var consent = box.querySelector('[data-g="consent"]').checked;
        if (!name) return fail("Please enter the guardian's name.");
        if (!contact) return fail("Please enter an email or phone number.");
        if (!consent) return fail("Guardian consent is required here — or use \u201cSkip for now\u201d.");
        fetch(BASE + "/api/consent/guardian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: propertyId || undefined,
            visitor_hash: vid(),
            guardian_name: name,
            relationship: rel,
            contact: contact,
            consent_given: true
          })
        }).then(function () {
          finish("under18", under18Necessary());
        }).catch(function () {
          // The under-18 choice itself must always be recorded, even if the
          // guardian record could not be saved.
          finish("under18", under18Necessary());
        });
      };
      skip.onclick = function (e) {
        e.preventDefault();
        finish("under18", under18Necessary());
      };
    }
    function field() {
      return "width:100%;box-sizing:border-box;background:#fff;border:1px solid #d3cbb6;border-radius:4px;" +
        "padding:8px 10px;font-size:12.5px;font-family:inherit;color:#1c1a17;";
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
        var propId = (cfg.property && cfg.property.id) || "";
        render(s.banner || { title: "We value your privacy", text: "", accept_label: "Accept all", reject_label: "Reject non-essential", customize_label: "Customise" }, s, propId);
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
