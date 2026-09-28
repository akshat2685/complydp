/**
 * Demo seed for the Pramaan MVP.
 *
 * Fictional tenant: Meridian Foods Pvt. Ltd. (meridianfoods.in), a D2C food
 * brand. All people, events and numbers are invented for the demo — the
 * plumbing (hash chains, persistence, scanners) is real.
 */
import { newId, nowIso, sha256, runC } from "./db";
import type { Client } from "@libsql/client";

const H = (s: string) => sha256(s).slice(0, 16);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

/**
 * Takes the already-open client: during first-boot init, calling back into
 * db() would re-enter the in-flight init promise and deadlock.
 */
export async function seedDemoTenant(client: Client) {
  const run = (sql: string, ...args: unknown[]) => runC(client, sql, args);
  const t = nowIso();

  /* ---------------- Tenant & property ---------------- */
  await run(`INSERT INTO tenant (id, name, domain, dpo_name, dpo_email, settings_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    "tenant_meridian",
    "Meridian Foods Pvt. Ltd.",
    "meridianfoods.in",
    "Rudra Pratap Dalei",
    "dpo@meridianfoods.in",
    JSON.stringify({
      age_gating: true,
      notice_version: "v2.3",
      banner: {
        title: "We value your privacy",
        text: "Meridian Foods uses cookies to run the store, remember your cart and — with your permission — measure and personalise. Read our Privacy Notice.",
        accept_label: "Accept all",
        reject_label: "Reject non-essential",
        customize_label: "Customise",
        position: "bottom",
        theme: "paper",
      },
      form_branding: { heading: "Exercise your privacy rights", accent: "seal" },
    }),
    t
  );

  await run(`INSERT INTO properties (id, tenant_id, domain, display_name, created_at) VALUES (?, ?, ?, ?, ?)`,"prop_main", "tenant_meridian", "meridianfoods.in", "Meridian Foods — Web Store", t);

  /* ---------------- Cookie inventory ----------------
   * Demo tenant cookies (first block, source "auto") plus the known-cookie
   * library: ~250 real, widely-used cookies seeded as reference data so scans
   * can classify against them. Source "library" marks reference entries.
   * Wildcard names carry a "<…>" pattern note in the description.
   */
  const cookies: Array<[string, string, string, string, string, string, string]> = [
    // name, category, source, description, duration, vendor_hint, first_seen_offset
    // --- Demo tenant (Meridian Foods) ---
    ["mf_session", "necessary", "auto", "Keeps you signed in between pages during checkout.", "Session", "Meridian Foods", "14d"],
    ["cart_id", "necessary", "auto", "Remembers the items in your shopping cart.", "30 days", "Meridian Foods", "14d"],
    ["mf_consent", "necessary", "auto", "Stores the consent choices you make in this banner.", "12 months", "Meridian Foods", "14d"],
    ["cf_clearance", "necessary", "auto", "Bot protection challenge token.", "30 minutes", "Cloudflare", "14d"],
    ["razorpay_session", "necessary", "auto", "Payment session for Razorpay checkout.", "Session", "Razorpay", "14d"],
    ["mf_pref_lang", "functional", "auto", "Remembers your language preference (EN/HI).", "12 months", "Meridian Foods", "13d"],
    ["mf_ab_bucket", "functional", "auto", "A/B test bucket for homepage experiments.", "30 days", "Meridian Foods", "10d"],
    ["_ga", "analytics", "auto", "Google Analytics: distinguishes visitors.", "2 years", "Google", "14d"],
    ["_ga_MF9X2KQ", "analytics", "auto", "Google Analytics: persists session state.", "2 years", "Google", "14d"],
    ["_fbp", "marketing", "auto", "Meta Pixel: tracks visits for ad measurement.", "3 months", "Meta", "12d"],
    ["_gcl_au", "marketing", "auto", "Google Ads: stores click identifiers.", "3 months", "Google", "12d"],
    ["_mf_track", "unclassified", "auto", "Seen on /checkout — vendor not yet identified.", "Unknown", "", "2d"],
    ["px_uid", "unclassified", "auto", "Seen on /blog — vendor not yet identified.", "Unknown", "", "1d"],
    // --- Known-cookie library: Google Analytics (GA4 + legacy Universal) ---
    ["_ga_<measurement-id>", "analytics", "library", "Pattern: GA4 cookie, one per measurement ID (e.g. _ga_G-ABC123). Persists session state.", "2 years", "Google", "14d"],
    ["_gid", "analytics", "library", "GA4: distinguishes users; 24-hour rolling identifier.", "24 hours", "Google", "14d"],
    ["_gat", "analytics", "library", "Legacy Universal Analytics: throttles request rate.", "1 minute", "Google", "14d"],
    ["_gat_<property-id>", "analytics", "library", "Pattern: legacy UA per-tracker throttle cookie (e.g. _gat_UA-12345-1).", "1 minute", "Google", "14d"],
    ["__utma", "analytics", "library", "Legacy Urchin/UA: distinguishes users and sessions.", "2 years", "Google", "14d"],
    ["__utmb", "analytics", "library", "Legacy Urchin/UA: determines new sessions vs visits.", "30 minutes", "Google", "14d"],
    ["__utmc", "analytics", "library", "Legacy Urchin/UA: works with __utmb to end a session.", "Session", "Google", "14d"],
    ["__utmz", "analytics", "library", "Legacy Urchin/UA: stores traffic source/campaign.", "6 months", "Google", "14d"],
    ["__utmt", "analytics", "library", "Legacy Urchin/UA: throttles request rate.", "10 minutes", "Google", "14d"],
    ["_gac_<property-id>", "analytics", "library", "Pattern: stores Google Ads campaign info for GA attribution (e.g. _gac_UA-12345-1).", "90 days", "Google", "14d"],
    // --- Known-cookie library: Meta Pixel ---
    ["_fbc", "marketing", "library", "Meta Pixel: stores the Facebook click ID (fbclid) for ad attribution.", "2 years", "Meta", "14d"],
    // --- Known-cookie library: Google Ads ---
    ["_gcl_aw", "marketing", "library", "Google Ads: stores the Google click ID for AdWords conversion tracking.", "90 days", "Google", "14d"],
    ["_gcl_dc", "marketing", "library", "Google Ads: stores click data for DoubleClick Floodlight conversions.", "90 days", "Google", "14d"],
    ["_gcl_gb", "marketing", "library", "Google Ads: cross-domain click data for gtag.js conversion tracking.", "90 days", "Google", "14d"],
    // --- Known-cookie library: Google services, consent & security ---
    ["AEC", "necessary", "library", "Google: anti-abuse / bot protection for Google services.", "6 months", "Google", "14d"],
    ["SOCS", "necessary", "library", "Google: stores the consent state for Google services.", "2 years", "Google", "14d"],
    ["NID", "functional", "library", "Google: stores preferences (e.g. language) on Google services.", "6 months", "Google", "14d"],
    ["CONSENT", "necessary", "library", "Google: stores consent choices for Google services.", "2 years", "Google", "14d"],
    ["SEARCH_SAMESITE", "functional", "library", "Google: mitigates CSRF risk on Google Search.", "6 months", "Google", "14d"],
    ["SID", "necessary", "library", "Google: digitally signed record of the signed-in Google account.", "2 years", "Google", "14d"],
    ["HSID", "necessary", "library", "Google: anti-fraud record of the signed-in Google account.", "2 years", "Google", "14d"],
    ["SAPISID", "necessary", "library", "Google: builds a profile of interests for Google services.", "2 years", "Google", "14d"],
    ["1P_JAR", "marketing", "library", "Google: gathers website statistics and serves personalised ads.", "30 days", "Google", "14d"],
    ["ANID", "marketing", "library", "Google: ad personalisation across Google ad products.", "9 months", "Google", "14d"],
    ["DV", "necessary", "library", "Google: short-lived anti-abuse signal.", "10 minutes", "Google", "14d"],
    ["__gads", "marketing", "library", "Google AdSense: measures ad interactions and prevents repeat-serving.", "13 months", "Google", "14d"],
    ["__gpi", "marketing", "library", "Google AdSense: ad personalisation identifier.", "13 months", "Google", "14d"],
    ["__eoi", "marketing", "library", "Google: ad measurement / frequency capping.", "6 months", "Google", "14d"],
    ["__Secure-ENID", "necessary", "library", "Google: encrypted record of the signed-in account.", "13 months", "Google", "14d"],
    ["FCCDCF", "necessary", "library", "Google Funding Choices: stores consent/messaging state.", "1 year", "Google", "14d"],
    // --- Known-cookie library: IAB TCF & consent management ---
    ["euconsent-v2", "necessary", "library", "IAB Transparency & Consent Framework: encoded TCF v2 consent string.", "1 year", "IAB", "14d"],
    ["addtl_consent", "necessary", "library", "Google Additional Consent: consent for non-IAB vendors (AC string).", "1 year", "Google", "14d"],
    ["didomi_token", "necessary", "library", "Didomi CMP: stores the user consent status.", "1 year", "Didomi", "14d"],
    ["CookieConsent", "necessary", "library", "Cookiebot CMP: stores consent state.", "1 year", "Cookiebot", "14d"],
    ["CookieConsentBulkTicket", "necessary", "library", "Cookiebot CMP: bulk consent ticket for multi-domain setups.", "1 year", "Cookiebot", "14d"],
    ["OptanonConsent", "necessary", "library", "OneTrust CMP: stores consent choices.", "365 days", "OneTrust", "14d"],
    ["OptanonAlertBoxClosed", "functional", "library", "OneTrust CMP: records that the banner was closed.", "365 days", "OneTrust", "14d"],
    ["cookieyes-consent", "necessary", "library", "CookieYes CMP: stores consent choices.", "1 year", "CookieYes", "14d"],
    // --- Known-cookie library: DoubleClick ---
    ["IDE", "marketing", "library", "DoubleClick: ad personalisation and targeting identifier.", "1 year 24 days", "Google", "14d"],
    ["test_cookie", "marketing", "library", "DoubleClick: checks whether the browser supports cookies.", "15 minutes", "Google", "14d"],
    ["DSID", "marketing", "library", "DoubleClick: identifies a signed-in user on non-Google sites for ads.", "2 weeks", "Google", "14d"],
    ["id", "marketing", "library", "DoubleClick (doubleclick.net): ad measurement identifier.", "2 years", "Google", "14d"],
    // --- Known-cookie library: Facebook ---
    ["fr", "marketing", "library", "Facebook: encrypted browser ID + login state for ads.", "3 months", "Meta", "14d"],
    ["c_user", "functional", "library", "Facebook: the logged-in user ID.", "3 months", "Meta", "14d"],
    ["xs", "necessary", "library", "Facebook: session secret for authentication.", "3 months", "Meta", "14d"],
    ["datr", "necessary", "library", "Facebook: browser identity for security and fraud detection.", "2 years", "Meta", "14d"],
    ["sb", "necessary", "library", "Facebook: browser identity for security.", "2 years", "Meta", "14d"],
    ["presence", "functional", "library", "Facebook: chat tab / online presence status.", "Session", "Meta", "14d"],
    ["wd", "functional", "library", "Facebook: browser viewport dimensions.", "1 week", "Meta", "14d"],
    ["dpr", "functional", "library", "Facebook: device pixel ratio.", "1 week", "Meta", "14d"],
    ["_js_datr", "necessary", "library", "Facebook: JS-set browser identity for security.", "2 years", "Meta", "14d"],
    // --- Known-cookie library: Instagram ---
    ["ig_did", "marketing", "library", "Instagram: device identifier for ads and analytics.", "1 year", "Meta", "14d"],
    ["mid", "marketing", "library", "Instagram: device identifier.", "1 year", "Meta", "14d"],
    ["ig_nrcb", "functional", "library", "Instagram: cookie-banner dismissal state.", "1 year", "Meta", "14d"],
    // --- Known-cookie library: X (Twitter) ---
    ["personalization_id", "marketing", "library", "X: ad personalisation identifier.", "2 years", "X (Twitter)", "14d"],
    ["guest_id", "marketing", "library", "X: identifier for logged-out visitors.", "2 years", "X (Twitter)", "14d"],
    ["guest_id_ads", "marketing", "library", "X: logged-out visitor identifier for ads.", "2 years", "X (Twitter)", "14d"],
    ["guest_id_marketing", "marketing", "library", "X: logged-out visitor identifier for marketing.", "2 years", "X (Twitter)", "14d"],
    ["ct0", "necessary", "library", "X: CSRF token.", "6 hours", "X (Twitter)", "14d"],
    ["twid", "marketing", "library", "X: client-known device identifier.", "5 years", "X (Twitter)", "14d"],
    ["muc_ads", "marketing", "library", "X: logged-out visitor identifier for ads.", "2 years", "X (Twitter)", "14d"],
    ["_twitter_sess", "necessary", "library", "X: session cookie for the web app.", "Session", "X (Twitter)", "14d"],
    // --- Known-cookie library: LinkedIn Insight Tag ---
    ["li_gc", "necessary", "library", "LinkedIn: stores cookie consent state.", "180 days", "LinkedIn", "14d"],
    ["lidc", "marketing", "library", "LinkedIn: data-centre routing for the Insight Tag.", "24 hours", "LinkedIn", "14d"],
    ["bcookie", "marketing", "library", "LinkedIn: browser ID for ads and security.", "2 years", "LinkedIn", "14d"],
    ["bscookie", "marketing", "library", "LinkedIn: secure browser ID for fraud prevention.", "2 years", "LinkedIn", "14d"],
    ["lang", "functional", "library", "LinkedIn: language preference.", "Session", "LinkedIn", "14d"],
    ["UserMatchHistory", "marketing", "library", "LinkedIn: ad ID sync / matched-audience history.", "30 days", "LinkedIn", "14d"],
    ["li_sugr", "marketing", "library", "LinkedIn: matched identity / lead-gen form data.", "90 days", "LinkedIn", "14d"],
    ["AnalyticsSyncHistory", "marketing", "library", "LinkedIn: time of last analytics sync.", "30 days", "LinkedIn", "14d"],
    ["li_fat_id", "marketing", "library", "LinkedIn: indirect member identifier for ads.", "30 days", "LinkedIn", "14d"],
    // --- Known-cookie library: TikTok, Snapchat, Pinterest, Reddit ---
    ["_ttp", "marketing", "library", "TikTok Pixel: click identifier for ad attribution.", "13 months", "TikTok", "14d"],
    ["tt_csrf_token", "necessary", "library", "TikTok: CSRF protection token.", "Session", "TikTok", "14d"],
    ["_scid", "marketing", "library", "Snapchat Pixel: unique ID for ad measurement.", "13 months", "Snapchat", "14d"],
    ["_pin_unauth", "marketing", "library", "Pinterest Tag: groups actions for logged-out users.", "1 year", "Pinterest", "14d"],
    ["_pinterest_ct_ua", "marketing", "library", "Pinterest: conversion tracking user agent signal.", "1 year", "Pinterest", "14d"],
    ["_rdt_uuid", "marketing", "library", "Reddit Pixel: unique ID for ad attribution.", "90 days", "Reddit", "14d"],
    // --- Known-cookie library: Microsoft Ads (UET) & Clarity ---
    ["_uetsid", "marketing", "library", "Microsoft Ads UET: session ID for conversion tracking.", "1 day", "Microsoft", "14d"],
    ["_uetvid", "marketing", "library", "Microsoft Ads UET: visitor ID for conversion tracking.", "1 year 25 days", "Microsoft", "14d"],
    ["MUID", "marketing", "library", "Microsoft: user identifier for ads across Bing/MSN.", "1 year 25 days", "Microsoft", "14d"],
    ["_clck", "analytics", "library", "Microsoft Clarity: persists the Clarity user ID.", "1 year", "Microsoft", "14d"],
    ["_clsk", "analytics", "library", "Microsoft Clarity: groups page views into a session recording.", "1 day", "Microsoft", "14d"],
    ["CLID", "analytics", "library", "Microsoft Clarity: Clarity identifier.", "1 year", "Microsoft", "14d"],
    // --- Known-cookie library: Yahoo ---
    ["B", "marketing", "library", "Yahoo: browser identifier for ads.", "1 year", "Yahoo", "14d"],
    ["A3", "necessary", "library", "Yahoo: authentication / session cookie.", "1 year", "Yahoo", "14d"],
    ["A1", "necessary", "library", "Yahoo: authentication cookie.", "1 year", "Yahoo", "14d"],
    // --- Known-cookie library: other ad-tech ---
    ["t_gid", "marketing", "library", "Taboola: unique user ID for content recommendations.", "1 year", "Taboola", "14d"],
    ["mc", "marketing", "library", "Quantcast: audience measurement identifier.", "13 months", "Quantcast", "14d"],
    ["d", "marketing", "library", "Quantcast: audience measurement identifier.", "13 months", "Quantcast", "14d"],
    ["__qca", "marketing", "library", "Quantcast (legacy): audience measurement identifier.", "13 months", "Quantcast", "14d"],
    ["cto_bundle", "marketing", "library", "Criteo: bundles identifiers for retargeting.", "13 months", "Criteo", "14d"],
    ["outbrain_cid_fetch", "marketing", "library", "Outbrain: click ID fetch for recommendation tracking.", "1 month", "Outbrain", "14d"],
    ["TDID", "marketing", "library", "The Trade Desk: unified ad ID.", "1 year", "The Trade Desk", "14d"],
    ["TDCPM", "marketing", "library", "The Trade Desk: ad campaign measurement.", "1 year", "The Trade Desk", "14d"],
    ["uuid2", "marketing", "library", "Xandr (AppNexus): unique user ID for programmatic ads.", "90 days", "Xandr", "14d"],
    ["anj", "marketing", "library", "Xandr (AppNexus): ad profile identifier.", "90 days", "Xandr", "14d"],
    ["KADUSERCOOKIE", "marketing", "library", "PubMatic: user identifier for programmatic auctions.", "3 months", "PubMatic", "14d"],
    ["ad-id", "marketing", "library", "Amazon Ads: advertising identifier.", "13 months", "Amazon", "14d"],
    // --- Known-cookie library: marketing automation / CRM ---
    ["_mkto_trk", "marketing", "library", "Marketo: lead tracking cookie.", "2 years", "Marketo", "14d"],
    ["ELOQUA", "marketing", "library", "Oracle Eloqua: visitor tracking cookie.", "2 years", "Oracle", "14d"],
    ["visitor_id<account-id>", "marketing", "library", "Pattern: Salesforce Pardot visitor ID, one per account (e.g. visitor_id123456).", "10 years", "Salesforce", "14d"],
    ["ck_subscriber_id", "marketing", "library", "ConvertKit: subscriber identifier.", "1 year", "ConvertKit", "14d"],
    ["_drip_client_<account-id>", "marketing", "library", "Pattern: Drip site identifier, one per account (e.g. _drip_client_6994213).", "2 weeks", "Drip", "14d"],
    ["__kla_id", "marketing", "library", "Klaviyo: onsite visitor identifier.", "2 years", "Klaviyo", "14d"],
    ["_mcid", "analytics", "library", "Mailchimp: campaign attribution identifier.", "1 year", "Mailchimp", "14d"],
    ["BrowserId", "necessary", "library", "Salesforce: browser session identifier.", "1 year", "Salesforce", "14d"],
    ["CookieConsentPolicy", "necessary", "library", "Salesforce: stores cookie consent policy state.", "1 year", "Salesforce", "14d"],
    // --- Known-cookie library: Hotjar ---
    ["_hjSessionUser_<site-id>", "analytics", "library", "Pattern: Hotjar user ID, one per site (e.g. _hjSessionUser_1234567).", "365 days", "Hotjar", "14d"],
    ["_hjSession_<site-id>", "analytics", "library", "Pattern: Hotjar session data, one per site.", "30 minutes", "Hotjar", "14d"],
    ["_hjIncludedInSessionSample_<site-id>", "analytics", "library", "Pattern: Hotjar session-sampling flag, one per site.", "30 minutes", "Hotjar", "14d"],
    ["_hjAbsoluteSessionInProgress", "analytics", "library", "Hotjar: detects the first pageview of a session.", "30 minutes", "Hotjar", "14d"],
    ["_hjFirstSeen", "analytics", "library", "Hotjar: identifies a new user session.", "30 minutes", "Hotjar", "14d"],
    ["_hjTLDTest", "analytics", "library", "Hotjar: tests cookie storage across subdomains.", "Session", "Hotjar", "14d"],
    ["_hjRecordingEnabled", "analytics", "library", "Hotjar: indicates an active session recording.", "Session", "Hotjar", "14d"],
    // --- Known-cookie library: product analytics (Segment, Mixpanel, Amplitude, PostHog, Heap) ---
    ["ajs_anonymous_id", "analytics", "library", "Segment: anonymous visitor identifier.", "1 year", "Segment", "14d"],
    ["ajs_user_id", "analytics", "library", "Segment: identified user ID.", "1 year", "Segment", "14d"],
    ["ajs_group_id", "analytics", "library", "Segment: group/account identifier.", "1 year", "Segment", "14d"],
    ["mp_<project-token>_mixpanel", "analytics", "library", "Pattern: Mixpanel distinct-ID persistence, one per project token.", "1 year", "Mixpanel", "14d"],
    ["amp_<api-key>", "analytics", "library", "Pattern: Amplitude device/user ID, one per API key.", "1 year", "Amplitude", "14d"],
    ["ph_<api-key>_posthog", "analytics", "library", "Pattern: PostHog distinct ID, one per project API key.", "1 year", "PostHog", "14d"],
    ["_hp2_id.<app-id>", "analytics", "library", "Pattern: Heap user identifier, one per app ID.", "13 months", "Heap", "14d"],
    // --- Known-cookie library: Adobe ---
    ["s_cc", "analytics", "library", "Adobe Analytics: checks whether cookies are enabled.", "Session", "Adobe", "14d"],
    ["s_sq", "analytics", "library", "Adobe Analytics: click-tracking / link-click data.", "Session", "Adobe", "14d"],
    ["s_vi", "analytics", "library", "Adobe Analytics: unique visitor ID.", "2 years", "Adobe", "14d"],
    ["AMCV_<org-id>", "analytics", "library", "Pattern: Adobe Experience Cloud visitor ID, one per org ID.", "2 years", "Adobe", "14d"],
    ["mbox", "marketing", "library", "Adobe Target: visitor profile for personalisation.", "2 years", "Adobe", "14d"],
    ["demdex", "marketing", "library", "Adobe Audience Manager: data-management platform ID.", "180 days", "Adobe", "14d"],
    // --- Known-cookie library: more analytics ---
    ["_pk_id.<site-id>.<domain-hash>", "analytics", "library", "Pattern: Matomo visitor ID, one per site (e.g. _pk_id.1.abc1).", "13 months", "Matomo", "14d"],
    ["_pk_ses.<site-id>.<domain-hash>", "analytics", "library", "Pattern: Matomo short-lived session cookie, one per site.", "30 minutes", "Matomo", "14d"],
    ["_ym_uid", "analytics", "library", "Yandex Metrica: visitor identifier.", "1 year", "Yandex", "14d"],
    ["_ym_d", "analytics", "library", "Yandex Metrica: date of first visit.", "1 year", "Yandex", "14d"],
    ["_chartbeat2", "analytics", "library", "Chartbeat: visitor engagement tracking.", "1 year", "Chartbeat", "14d"],
    ["__insp_uid", "analytics", "library", "Inspectlet: unique visitor identifier.", "1 year", "Inspectlet", "14d"],
    ["_cs_id", "analytics", "library", "ContentSquare: visitor identifier.", "13 months", "ContentSquare", "14d"],
    ["fs_uid", "analytics", "library", "FullStory: user identifier for session replay.", "2 years", "FullStory", "14d"],
    ["utag_main", "analytics", "library", "Tealium: visitor ID for the tag manager.", "1 year", "Tealium", "14d"],
    ["_dd_s", "analytics", "library", "Datadog RUM: session identifier.", "Session", "Datadog", "14d"],
    // --- Known-cookie library: A/B testing ---
    ["_vis_opt_s", "analytics", "library", "VWO: session-level experiment data.", "100 days", "VWO", "14d"],
    ["_vis_opt_test_cookie", "analytics", "library", "VWO: checks cookie support for experiments.", "100 days", "VWO", "14d"],
    ["_vwo_uuid", "analytics", "library", "VWO: unique visitor ID for experiments.", "366 days", "VWO", "14d"],
    ["_vwo_uuid_v2", "analytics", "library", "VWO: unique visitor ID (v2).", "366 days", "VWO", "14d"],
    ["optimizelyEndUserId", "analytics", "library", "Optimizely: unique end-user ID for experiments.", "10 years", "Optimizely", "14d"],
    ["optimizelyBuckets", "analytics", "library", "Optimizely: experiment bucket assignments.", "10 years", "Optimizely", "14d"],
    ["optimizelySegments", "analytics", "library", "Optimizely: audience segment membership.", "10 years", "Optimizely", "14d"],
    // --- Known-cookie library: live chat / support widgets ---
    ["intercom-id-<app-id>", "functional", "library", "Pattern: Intercom visitor ID, one per app (e.g. intercom-id-abc123).", "9 months", "Intercom", "14d"],
    ["intercom-session-<app-id>", "functional", "library", "Pattern: Intercom session data, one per app.", "7 days", "Intercom", "14d"],
    ["intercom-device-id-<app-id>", "functional", "library", "Pattern: Intercom device ID, one per app.", "9 months", "Intercom", "14d"],
    ["crisp-client/session/<website-id>", "functional", "library", "Pattern: Crisp chat session, one per website (slashes appear URL-encoded).", "Session", "Crisp", "14d"],
    ["twk_uuid_*", "functional", "library", "Pattern: Tawk.to visitor UUID, one per property.", "6 months", "Tawk.to", "14d"],
    ["twk_idm_key", "functional", "library", "Tawk.to: chat widget state key.", "Session", "Tawk.to", "14d"],
    ["twk_token_*", "functional", "library", "Pattern: Tawk.to session token, one per property.", "Session", "Tawk.to", "14d"],
    ["TawkConnectionTime", "functional", "library", "Tawk.to: chat connection timing.", "Session", "Tawk.to", "14d"],
    ["__lc_cid", "functional", "library", "LiveChat: visitor conversation ID.", "2 years", "LiveChat", "14d"],
    ["__lc_cst", "functional", "library", "LiveChat: visitor conversation state.", "2 years", "LiveChat", "14d"],
    ["_zendesk_session", "functional", "library", "Zendesk: session cookie for help centre / chat.", "Session", "Zendesk", "14d"],
    ["__zlcmid", "functional", "library", "Zendesk Chat: live-chat visitor ID.", "1 year", "Zendesk", "14d"],
    ["driftt_aid", "marketing", "library", "Drift: anonymous visitor identifier for chat targeting.", "2 years", "Drift", "14d"],
    // --- Known-cookie library: HubSpot ---
    ["__hstc", "analytics", "library", "HubSpot: main tracking cookie (visit timestamps).", "6 months", "HubSpot", "14d"],
    ["hubspotutk", "analytics", "library", "HubSpot: visitor identity.", "6 months", "HubSpot", "14d"],
    ["__hssc", "analytics", "library", "HubSpot: session restart counter.", "30 minutes", "HubSpot", "14d"],
    ["__hssrc", "analytics", "library", "HubSpot: marks session views.", "Session", "HubSpot", "14d"],
    ["__hs_opt_out", "necessary", "library", "HubSpot: records cookie opt-out.", "6 months", "HubSpot", "14d"],
    // --- Known-cookie library: payments ---
    ["__stripe_mid", "necessary", "library", "Stripe: machine identifier for fraud prevention.", "1 year", "Stripe", "14d"],
    ["__stripe_sid", "necessary", "library", "Stripe: session identifier for fraud prevention.", "30 minutes", "Stripe", "14d"],
    ["m", "necessary", "library", "Stripe (m.stripe.com): device fingerprinting for fraud prevention.", "2 years", "Stripe", "14d"],
    ["__stripe_orig-probe", "necessary", "library", "Stripe: TLS probing cookie.", "12 hours", "Stripe", "14d"],
    ["x-pp-s", "necessary", "library", "PayPal: session state for checkout.", "Session", "PayPal", "14d"],
    ["ts", "necessary", "library", "PayPal: fraud detection / payment identifier.", "3 years", "PayPal", "14d"],
    ["tsc", "necessary", "library", "PayPal: session-scoped fraud signal.", "Session", "PayPal", "14d"],
    ["enforce_policy", "functional", "library", "PayPal: enforces cookie policy choices.", "1 year", "PayPal", "14d"],
    ["nsid", "necessary", "library", "PayPal: session identifier for checkout.", "Session", "PayPal", "14d"],
    ["cookie_prefs", "functional", "library", "PayPal: cookie preference choices.", "1 year", "PayPal", "14d"],
    // --- Known-cookie library: security / bot protection / WAF ---
    ["__cf_bm", "necessary", "library", "Cloudflare: bot management challenge cookie.", "30 minutes", "Cloudflare", "14d"],
    ["_cfuvid", "necessary", "library", "Cloudflare: rate-limiting / bot detection identifier.", "Session", "Cloudflare", "14d"],
    ["__cflb", "necessary", "library", "Cloudflare: load-balancer session affinity.", "24 hours", "Cloudflare", "14d"],
    ["aws-waf-token", "necessary", "library", "AWS WAF: bot-control challenge token.", "Session", "AWS", "14d"],
    ["_abck", "necessary", "library", "Akamai Bot Manager: browser fingerprint.", "1 year", "Akamai", "14d"],
    ["ak_bmsc", "necessary", "library", "Akamai Bot Manager: session cookie.", "2 hours", "Akamai", "14d"],
    ["bm_sz", "necessary", "library", "Akamai Bot Manager: browser signal.", "4 hours", "Akamai", "14d"],
    ["incap_ses_<site-id>", "necessary", "library", "Pattern: Imperva session cookie, one per site.", "Session", "Imperva", "14d"],
    ["visid_incap_<site-id>", "necessary", "library", "Pattern: Imperva visitor ID, one per site.", "1 year", "Imperva", "14d"],
    ["datadome", "necessary", "library", "DataDome: bot protection device cookie.", "1 year", "DataDome", "14d"],
    ["_GRECAPTCHA", "necessary", "library", "Google reCAPTCHA: risk analysis for the widget.", "6 months", "Google", "14d"],
    // --- Known-cookie library: embedded media ---
    ["VISITOR_INFO1_LIVE", "marketing", "library", "YouTube: bandwidth estimate for embedded players.", "6 months", "YouTube", "14d"],
    ["YSC", "marketing", "library", "YouTube: unique ID for embedded video views.", "Session", "YouTube", "14d"],
    ["PREF", "functional", "library", "YouTube: player preferences (e.g. autoplay).", "8 months", "YouTube", "14d"],
    // --- Known-cookie library: Shopify ---
    ["_shopify_y", "analytics", "library", "Shopify: storefront analytics visitor ID.", "2 years", "Shopify", "14d"],
    ["_shopify_s", "analytics", "library", "Shopify: storefront analytics session.", "30 minutes", "Shopify", "14d"],
    ["_shopify_sa_p", "marketing", "library", "Shopify: marketing analytics (pixel) data.", "30 minutes", "Shopify", "14d"],
    ["_shopify_sa_t", "marketing", "library", "Shopify: marketing analytics (pixel) data.", "30 minutes", "Shopify", "14d"],
    ["_shopify_m", "marketing", "library", "Shopify: marketing / campaign tracking.", "2 years", "Shopify", "14d"],
    ["_y", "analytics", "library", "Shopify: checkout analytics visitor ID.", "2 years", "Shopify", "14d"],
    ["_s", "analytics", "library", "Shopify: checkout analytics session.", "30 minutes", "Shopify", "14d"],
    ["cart", "necessary", "library", "Shopify: cart contents.", "14 days", "Shopify", "14d"],
    ["secure_customer_sig", "necessary", "library", "Shopify: signed customer session.", "20 years", "Shopify", "14d"],
    ["checkout_token", "necessary", "library", "Shopify: checkout session token.", "1 year", "Shopify", "14d"],
    ["cart_currency", "functional", "library", "Shopify: cart currency preference.", "14 days", "Shopify", "14d"],
    // --- Known-cookie library: WooCommerce ---
    ["woocommerce_cart_hash", "necessary", "library", "WooCommerce: cart contents hash.", "Session", "WooCommerce", "14d"],
    ["woocommerce_items_in_cart", "necessary", "library", "WooCommerce: whether the cart has items.", "Session", "WooCommerce", "14d"],
    ["wp_woocommerce_session_<hash>", "necessary", "library", "Pattern: WooCommerce session, one per customer hash.", "2 days", "WooCommerce", "14d"],
    // --- Known-cookie library: Magento ---
    ["PHPSESSID", "necessary", "library", "PHP/Magento: session identifier.", "Session", "Magento", "14d"],
    ["frontend", "necessary", "library", "Magento: storefront session ID.", "1 hour", "Magento", "14d"],
    ["form_key", "necessary", "library", "Magento: CSRF protection form key.", "1 hour", "Magento", "14d"],
    ["mage-messages", "functional", "library", "Magento: error / success message storage.", "1 year", "Magento", "14d"],
    // --- Known-cookie library: WordPress ---
    ["wordpress_logged_in_<hash>", "necessary", "library", "Pattern: WordPress login session, one per user hash.", "Session", "WordPress", "14d"],
    ["wp-settings-<user-id>", "functional", "library", "Pattern: WordPress admin/editor settings, one per user.", "1 year", "WordPress", "14d"],
    ["wp-settings-time-<user-id>", "functional", "library", "Pattern: WordPress settings timestamp, one per user.", "1 year", "WordPress", "14d"],
    ["wordpress_test_cookie", "necessary", "library", "WordPress: checks whether cookies are enabled at login.", "Session", "WordPress", "14d"],
    ["wp_lang", "functional", "library", "WordPress: admin language preference.", "Session", "WordPress", "14d"],
    ["comment_author_<hash>", "functional", "library", "Pattern: WordPress remembers commenter details.", "1 year", "WordPress", "14d"],
    ["wp-postpass_<hash>", "necessary", "library", "Pattern: WordPress password-protected post access.", "10 days", "WordPress", "14d"],
    // --- Known-cookie library: Drupal ---
    ["SSESS<hash>", "necessary", "library", "Pattern: Drupal session cookie, name includes a site hash.", "23 days", "Drupal", "14d"],
    // --- Known-cookie library: Wix ---
    ["XSRF-TOKEN", "necessary", "library", "Wix: CSRF protection token.", "Session", "Wix", "14d"],
    ["hs", "necessary", "library", "Wix: security / session cookie.", "Session", "Wix", "14d"],
    ["svSession", "necessary", "library", "Wix: persistent login session.", "12 months", "Wix", "14d"],
    ["bSession", "analytics", "library", "Wix: session analytics (30-minute effectiveness window).", "30 minutes", "Wix", "14d"],
    ["consent-policy", "necessary", "library", "Wix: cookie consent policy parameters.", "12 months", "Wix", "14d"],
    // --- Known-cookie library: web frameworks ---
    ["connect.sid", "necessary", "library", "Express.js: session ID cookie.", "Session", "Express.js", "14d"],
    ["sessionid", "necessary", "library", "Django: session identifier.", "2 weeks", "Django", "14d"],
    ["csrftoken", "necessary", "library", "Django: CSRF protection token.", "1 year", "Django", "14d"],
    ["laravel_session", "necessary", "library", "Laravel: session identifier.", "2 hours", "Laravel", "14d"],
    ["ASP.NET_SessionId", "necessary", "library", "ASP.NET: session identifier.", "Session", "Microsoft", "14d"],
    ["JSESSIONID", "necessary", "library", "Java/Jakarta: session identifier.", "Session", "Java", "14d"],
    ["ci_session", "necessary", "library", "CodeIgniter: session identifier.", "2 hours", "CodeIgniter", "14d"],
    ["symfony", "necessary", "library", "Symfony: session identifier.", "Session", "Symfony", "14d"],
    ["MoodleSession", "necessary", "library", "Moodle: session identifier.", "Session", "Moodle", "14d"],
    ["BIGipServer<pool>", "necessary", "library", "Pattern: F5 BIG-IP load-balancer stickiness, one per pool.", "Session", "F5", "14d"],
    // --- Known-cookie library: auth ---
    ["next-auth.session-token", "necessary", "library", "NextAuth.js: session token.", "30 days", "NextAuth.js", "14d"],
    ["next-auth.csrf-token", "necessary", "library", "NextAuth.js: CSRF token.", "Session", "NextAuth.js", "14d"],
    ["next-auth.callback-url", "necessary", "library", "NextAuth.js: post-login redirect URL.", "Session", "NextAuth.js", "14d"],
    ["sb-<project-ref>-auth-token", "necessary", "library", "Pattern: Supabase auth session, one per project ref.", "1 year", "Supabase", "14d"],
    ["__session", "necessary", "library", "Firebase: session cookie for SSR auth.", "Session", "Firebase", "14d"],
    ["auth0", "necessary", "library", "Auth0: authentication transaction state.", "Session", "Auth0", "14d"],
    ["auth0_compat", "necessary", "library", "Auth0: compatibility fallback for the auth transaction.", "Session", "Auth0", "14d"],
    ["did", "necessary", "library", "Auth0: device identifier for anomaly detection.", "Session", "Auth0", "14d"],
    ["did_compat", "necessary", "library", "Auth0: compatibility fallback for the device identifier.", "Session", "Auth0", "14d"],
    ["auth0.is.authenticated", "functional", "library", "Auth0: flags an authenticated session for the SDK.", "1 day", "Auth0", "14d"],
    ["CognitoIdentityServiceProvider.<client-id>.LastAuthUser", "necessary", "library", "Pattern: AWS Cognito last signed-in user, one per client ID.", "1 year", "AWS", "14d"],
    ["ESTSAUTH", "necessary", "library", "Microsoft Entra ID: authentication session.", "Session", "Microsoft", "14d"],
    ["ESTSAUTHPERSISTENT", "necessary", "library", "Microsoft Entra ID: persistent authentication session.", "Session", "Microsoft", "14d"],
    // --- Known-cookie library: infrastructure ---
    ["AWSALB", "necessary", "library", "AWS ALB: target-group stickiness.", "1 week", "AWS", "14d"],
    ["AWSALBCORS", "necessary", "library", "AWS ALB: CORS-aware target-group stickiness.", "1 week", "AWS", "14d"],
    ["ARRAffinity", "necessary", "library", "Azure App Service: instance affinity.", "Session", "Microsoft", "14d"],
    ["ARRAffinitySameSite", "necessary", "library", "Azure App Service: SameSite-compatible instance affinity.", "Session", "Microsoft", "14d"],
    ["googtrans", "functional", "library", "Google Translate widget: translation language pair.", "Session", "Google", "14d"],
    ["pll_language", "functional", "library", "Polylang (WordPress): language preference.", "1 year", "Polylang", "14d"],
  ];
  for (const [name, cat, src, desc, dur, vendor, seen] of cookies) {
    await run(`INSERT INTO cookies (id, property_id, name, category, source, description, duration, vendor_hint, first_seen, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,newId("ck"), "prop_main", name, cat, src, desc, dur, vendor, daysAgo(parseInt(seen)), t);
  }

  /* ---------------- Scans ---------------- */
  await run(`INSERT INTO scans (id, property_id, kind, status, started_at, finished_at, stats_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId("scan"),
    "prop_main",
    "cookie",
    "complete",
    daysAgo(1),
    daysAgo(1),
    JSON.stringify({ pages_crawled: 14, cookies_found: cookies.length, new_since_last: 2, trackers_blocked_pre_consent: 0 })
  );

  /* ---------------- Consent events (hash-chained) ---------------- */
  const consentModes: Array<[string, { necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean }, string, string]> = [
    ["adult", { necessary: true, functional: true, analytics: true, marketing: true }, "banner", "3d"],
    ["adult", { necessary: true, functional: false, analytics: false, marketing: false }, "banner", "3d"],
    ["adult", { necessary: true, functional: true, analytics: false, marketing: false }, "banner", "2d"],
    ["under18", { necessary: true, functional: false, analytics: false, marketing: false }, "age_gate", "2d"],
    ["adult", { necessary: true, functional: true, analytics: true, marketing: false }, "banner", "2d"],
    ["adult", { necessary: true, functional: false, analytics: true, marketing: true }, "banner", "1d"],
    ["under18", { necessary: true, functional: false, analytics: false, marketing: false }, "age_gate", "1d"],
    ["adult", { necessary: true, functional: true, analytics: true, marketing: true }, "banner", "1d"],
    ["adult", { necessary: true, functional: false, analytics: false, marketing: false }, "banner", "20h"],
    ["adult", { necessary: true, functional: true, analytics: false, marketing: true }, "banner", "12h"],
    ["adult", { necessary: true, functional: true, analytics: true, marketing: true }, "banner", "6h"],
    ["under18", { necessary: true, functional: false, analytics: false, marketing: false }, "age_gate", "2h"],
  ];
  // Insert oldest-first so the chain builds in chronological order.
  // The chain is computed locally from the hashes we create (not by
  // re-reading the DB), so the seed is immune to read-after-write
  // visibility quirks on first boot against a fresh remote database.
  // The hash does not cover created_at, so the backdated timestamp can be
  // used directly in both the hash and the row — no UPDATE needed.
  let consentPrev = "GENESIS";
  for (const [band, cats, mode, ago] of [...consentModes].reverse()) {
    const when = ago.endsWith("d") ? daysAgo(parseInt(ago)) : hoursAgo(parseInt(ago));
    const catsJson = JSON.stringify(cats);
    const visitorHash = H("visitor-" + Math.random().toString(36).slice(2));
    const id = newId("cev");
    const payload = [consentPrev, when, "prop_main", visitorHash, band, catsJson, mode, "v2.3"].join("|");
    const hash = sha256(payload);
    await run(
      `INSERT INTO consent_events (id, property_id, visitor_hash, age_band, categories_json, consent_mode, notice_version, created_at, prev_hash, event_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, "prop_main", visitorHash, band, catsJson, mode, "v2.3", when, consentPrev, hash
    );
    consentPrev = hash;
  }

  /* ---------------- DSR cases ---------------- */
  await run(`INSERT INTO dsr_cases (id, type, requester_name, requester_email, note, status, assignee, sla_due_at, created_at, resolved_at, resolution_note, tasks_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    "DSR-2026-0041", "access", "Ananya Iyer", "ananya.iyer@example.in",
    "Please share all personal data you hold about me, including order history.",
    "in_progress", "Rudra Pratap Dalei",
    new Date(Date.now() + 26 * 3600_000).toISOString(), daysAgo(2), null, "",
    JSON.stringify([
      { label: "Verify requester identity (OTP to registered email)", done: true },
      { label: "Pull records: users, orders, support tickets", done: true },
      { label: "Redact other individuals' data", done: false },
      { label: "Send data package + confirmation email", done: false },
    ])
  );
  await run(`INSERT INTO dsr_cases (id, type, requester_name, requester_email, note, status, assignee, sla_due_at, created_at, resolved_at, resolution_note, tasks_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    "DSR-2026-0042", "deletion", "Vikram Malhotra", "vikram.m@example.in",
    "Delete my account and all associated data. Order #MF-88213 was cancelled.",
    "new", "",
    new Date(Date.now() + 3 * 86_400_000).toISOString(), hoursAgo(5), null, "",
    JSON.stringify([
      { label: "Verify requester identity", done: false },
      { label: "Check retention overrides (tax invoices: 8 yrs)", done: false },
      { label: "Delete from prod DB, warehouse, backups queue", done: false },
      { label: "Confirm deletion to requester", done: false },
    ])
  );
  await run(`INSERT INTO dsr_cases (id, type, requester_name, requester_email, note, status, assignee, sla_due_at, created_at, resolved_at, resolution_note, tasks_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    "DSR-2026-0039", "correction", "Sana Sheikh", "sana.sheikh@example.in",
    "My phone number on the account is wrong — updated to the one in this email.",
    "resolved", "Rudra Pratap Dalei",
    daysAgo(1), daysAgo(4), daysAgo(2), "Phone number corrected in users table; confirmation email sent.",
    JSON.stringify([{ label: "Verify identity", done: true }, { label: "Update phone", done: true }])
  );

  /* ---------------- Breach case (live clocks) ---------------- */
  const awareness = hoursAgo(30);
  await run(`INSERT INTO breach_cases (id, code, title, description, status, severity, awareness_at, systems_json, categories_json, affected_count, step, board_notified_at, users_notified_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    "breach_001", "BR-2026-0117",
    "Support export emailed to wrong recipient",
    "A CSV export of 1,240 customer support interactions (names, phone numbers, order references) was emailed to a former support agent whose access was not revoked. Export generated from Zendesk by the support lead.",
    "open", "high", awareness,
    JSON.stringify(["Zendesk", "Gmail"]),
    JSON.stringify(["customer_name", "customer_phone", "order_history"]),
    1240, 1, null, null, awareness
  );

  /* ---------------- Vendors ---------------- */
  const vendors: Array<[string, string, string, string, string, string, string, string]> = [
    ["Razorpay", "Payments", "razorpay.com", "India", "signed", "low", "Engineering", "manual"],
    ["Amazon Web Services", "Cloud hosting (ap-south-1)", "aws.amazon.com", "India", "signed", "low", "Engineering", "manual"],
    ["Delhivery", "Logistics", "delhivery.com", "India", "signed", "medium", "Operations", "manual"],
    ["Freshdesk", "Customer support", "freshworks.com", "India", "signed", "medium", "Support", "manual"],
    ["SendGrid", "Transactional email", "sendgrid.com", "USA", "under_review", "medium", "Engineering", "cookie_scan"],
    ["Meta", "Advertising pixel", "meta.com", "USA", "not_started", "high", "Growth", "cookie_scan"],
    ["Google", "Analytics & Ads", "google.com", "USA", "under_review", "medium", "Growth", "cookie_scan"],
  ];
  const vendorIds: Record<string, string> = {};
  for (const [name, cat, domain, country, dpa, risk, owner, via] of vendors) {
    const id = newId("ven");
    vendorIds[name] = id;
    await run(`INSERT INTO vendors (id, name, category, domain, country, dpa_status, risk_tier, owner, notes, discovered_via, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,id, name, cat, domain, country, dpa, risk, owner, "", via, t);
  }

  /* ---------------- Systems & data fields ---------------- */
  const systems: Array<[string, string, string, string]> = [
    ["Production Postgres (ap-south-1)", "database", "Engineering", "Primary order & customer database on RDS Mumbai."],
    ["meridianfoods.in", "website", "Engineering", "Next.js storefront; consent banner deployed."],
    ["meridian-store (GitHub)", "codebase", "Engineering", "Monorepo: storefront, checkout service, admin."],
    ["Razorpay Dashboard", "saas", "Finance", "Payment settlements & refunds."],
    ["Zendesk", "saas", "Support", "Customer support tickets & chat."],
  ];
  const sysIds: Record<string, string> = {};
  for (const [name, kind, team, desc] of systems) {
    const id = newId("sys");
    sysIds[name] = id;
    await run(`INSERT INTO systems (id, name, kind, owner_team, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,id, name, kind, team, desc, t);
  }

  const fields: Array<[string, string, string, string, string]> = [
    // system, field, pii_category, source, note
    ["Production Postgres (ap-south-1)", "users.email", "direct_identifier", "auto", ""],
    ["Production Postgres (ap-south-1)", "users.phone", "direct_identifier", "auto", "Indian mobile numbers"],
    ["Production Postgres (ap-south-1)", "users.pan_number", "govt_id", "auto", "PAN collected for invoices above threshold"],
    ["Production Postgres (ap-south-1)", "users.dob", "quasi_identifier", "auto", ""],
    ["Production Postgres (ap-south-1)", "users.marketing_opt_in", "consent_record", "auto", ""],
    ["Production Postgres (ap-south-1)", "orders.upi_txn_id", "financial", "auto", "UPI transaction references"],
    ["Production Postgres (ap-south-1)", "orders.shipping_address", "direct_identifier", "auto", ""],
    ["Zendesk", "tickets.aadhaar_ref", "govt_id", "auto", "Agents sometimes paste Aadhaar refs — needs mapping"],
    ["meridianfoods.in", "analytics_events.ip_hash", "technical", "auto", "Hashed at collection"],
    ["meridian-store (GitHub)", "checkout.service.ts: buyerPhone", "direct_identifier", "auto", "Found by codebase scan"],
  ];
  for (const [sys, field, cat, src, note] of fields) {
    await run(`INSERT INTO data_fields (id, system_id, field_name, pii_category, classification_source, mapped_activity_id, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,newId("fld"), sysIds[sys], field, cat, src, "", note);
  }

  /* ---------------- Processing activities ---------------- */
  const activities: Array<[string, string, string, string, string, string, string[]]> = [
    ["Checkout & Payments", "Take orders and collect payment for food orders.", "Engineering", '["customers"]', "Contract", "7 years (tax)", ["Razorpay", "Amazon Web Services"]],
    ["Order Fulfilment & Delivery", "Pick, pack and deliver orders to customers.", "Operations", '["customers"]', "Contract", "2 years", ["Delhivery", "Amazon Web Services"]],
    ["Marketing Campaigns", "Email/SMS offers and ad measurement.", "Growth", '["customers", "prospects"]', "Consent", "Until consent withdrawn", ["SendGrid", "Meta", "Google"]],
    ["Customer Support", "Resolve order issues over ticket, chat and phone.", "Support", '["customers"]', "Legitimate interest", "3 years", ["Freshdesk"]],
    ["Product Analytics", "Understand store usage to improve the experience.", "Product", '["visitors", "customers"]', "Consent", "14 months", ["Google", "Amazon Web Services"]],
  ];
  for (const [name, purpose, team, subjects, basis, retention, vnames] of activities) {
    const id = newId("act");
    await run(`INSERT INTO processing_activities (id, name, purpose, owner_team, data_subjects_json, lawful_basis, retention, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,id, name, purpose, team, subjects, basis, retention, t);
    for (const vn of vnames) await run(`INSERT INTO activity_vendors (activity_id, vendor_id) VALUES (?, ?)`, id, vendorIds[vn]);
  }

  /* ---------------- Findings (attention queue) ---------------- */
  const findings: Array<[string, string, string, string, string, string, string, string]> = [
    ["consent", "Marketing cookies fire before consent on /checkout", "_fbp and _gcl_au observed in network log before any banner interaction on the checkout page.", "high", "needs_review", "DPDP Act §6 — consent must precede processing", "cookie_scan", "14d"],
    ["breach", "BR-2026-0117: user notification pending beyond 24h", "Breach awareness was 30h ago; affected users have not yet been notified.", "high", "needs_review", "DPDP Act §8(6) — notify affected principals without delay", "breach_center", "30h"],
    ["data_map", "Aadhaar reference field unmapped", "tickets.aadhaar_ref in Zendesk classified as govt_id but not mapped to any processing activity.", "medium", "needs_review", "DPDP Act §4 — purpose limitation", "classifier", "6d"],
    ["vendor", "Meta DPA not started", "Meta Pixel drops _fbp (marketing). No DPA on file; cross-border transfer safeguards unassessed.", "medium", "needs_review", "DPDP Act §16 — cross-border transfer", "cookie_scan", "12d"],
    ["dsr", "DSR-2026-0041 access request due in ~26h", "Access request from Ananya Iyer awaiting redaction + data package.", "medium", "needs_review", "DPDP Act §11, §13", "rights_center", "2d"],
    ["consent", "Cookie policy page updated to v2.3", "Notice version bumped; banner text re-published across property.", "low", "resolved", "", "manual", "3d"],
  ];
  for (const [cat, title, detail, sev, status, legal, src, ago] of findings) {
    const when = ago.endsWith("d") ? daysAgo(parseInt(ago)) : hoursAgo(parseInt(ago));
    const resolved = status === "resolved";
    await run(`INSERT INTO findings (id, category, title, detail, severity, status, legal_ref, source, created_at, resolved_at, resolution_note, evidence_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId("fnd"), cat, title, detail, sev, status, legal, src, when,
      resolved ? daysAgo(2) : null, resolved ? "Notice v2.3 published; banner re-rendered." : "",
      resolved ? H("notice-v2.3") : ""
    );
  }

  /* ---------------- Privacy notice ---------------- */
  await run(`INSERT INTO notices (id, version, title, content, published_at, active) VALUES (?, ?, ?, ?, ?, ?)`,
    newId("notice"), "v2.3", "Privacy Notice",
    [
      "Meridian Foods Pvt. Ltd. (\"we\") collects your name, contact details, order and payment information to fulfil your orders, and — only with your consent — to personalise offers and measure our store.",
      "Your rights under the DPDP Act, 2023: access a summary of your data; correct or complete it; erase it; nominate another person in case of incapacity; and withdraw consent at any time. Write to dpo@meridianfoods.in or use the request form on our website.",
      "We keep order records for 7 years for tax law and delete marketing data when you withdraw consent. We do not sell your personal data.",
      "If you are under 18, only strictly necessary cookies run on this site, and certain personalised features are disabled until a parent or guardian consents.",
    ].join("\n\n"),
    daysAgo(3), 1
  );

  /* ---------------- Seed ledger entries (chained) ---------------- */
  // The chain is computed locally from the hashes we create (not by
  // re-reading the DB), so the seed is immune to read-after-write
  // visibility quirks on first boot against a fresh remote database.
  // Payload layout mirrors ledgerAppend exactly: prev|ts|actor|action|
  // entity_type|entity_id|summary|details_json.
  const LEDGER_SEED: Array<[string, string, string, string, Record<string, unknown>, string]> = [
    ["tenant.created", "tenant", "tenant_meridian", "Tenant workspace created for Meridian Foods Pvt. Ltd.", { domain: "meridianfoods.in" }, "system"],
    ["notice.published", "notice", "v2.3", "Privacy Notice v2.3 published", { version: "v2.3" }, "Rudra Pratap Dalei"],
    ["scan.completed", "scan", "cookie", `Cookie scan completed: ${cookies.length} cookies across 14 pages`, { cookies: cookies.length, pages: 14 }, "system"],
    ["consent.config_updated", "property", "prop_main", "Age-gating enabled; under-18 visitors get necessary-only mode", { age_gating: true }, "Rudra Pratap Dalei"],
    ["dsr.received", "dsr_case", "DSR-2026-0041", "Access request received from Ananya Iyer", { channel: "hosted_form" }, "system"],
    ["dsr.received", "dsr_case", "DSR-2026-0042", "Deletion request received from Vikram Malhotra", { channel: "hosted_form" }, "system"],
    ["dsr.resolved", "dsr_case", "DSR-2026-0039", "Correction request resolved: phone number updated", {}, "Rudra Pratap Dalei"],
    ["breach.opened", "breach_case", "breach_001", "Breach BR-2026-0117 opened: support export misdirected", { affected: 1240, severity: "high" }, "Rudra Pratap Dalei"],
    ["breach.step_advanced", "breach_case", "breach_001", "Breach moved to step 2: clocks started (72h Board, user notice)", { step: 1 }, "system"],
    ["finding.resolved", "finding", "notice-v2.3", "Finding resolved: cookie policy page updated to v2.3", {}, "Rudra Pratap Dalei"],
  ];
  let ledgerPrev = "GENESIS";
  for (const [action, et, eid, summary, details, actor] of LEDGER_SEED) {
    const ts = nowIso();
    const detailsJson = JSON.stringify(details);
    const payload = [ledgerPrev, ts, actor, action, et, eid, summary, detailsJson].join("|");
    const hash = sha256(payload);
    await run(
      `INSERT INTO evidence_ledger (ts, actor, action, entity_type, entity_id, summary, details_json, prev_hash, entry_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ts, actor, action, et, eid, summary, detailsJson, ledgerPrev, hash
    );
    ledgerPrev = hash;
  }
}
