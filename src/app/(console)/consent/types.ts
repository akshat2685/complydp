export interface BannerCfg {
  title: string;
  text: string;
  accept_label: string;
  reject_label: string;
  customize_label: string;
  position: string;
  theme: string;
}

export interface ConsentSettings {
  age_gating: boolean;
  notice_version: string;
  banner: BannerCfg;
}

export interface CookieRow {
  id: string;
  property_id: string;
  name: string;
  category: string;
  source: string;
  description: string;
  duration: string;
  vendor_hint: string;
  first_seen: string;
  last_seen: string;
}

export interface ConsentEvent {
  id: string;
  visitor_hash: string;
  age_band: string;
  categories: { necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean };
  consent_mode: string;
  notice_version: string;
  event_hash: string;
  prev_hash: string;
  created_at: string;
}

export const CATEGORY_TONES: Record<string, "red" | "amber" | "blue" | "teal" | "mute" | "seal"> = {
  necessary: "mute",
  functional: "blue",
  analytics: "teal",
  marketing: "amber",
  unclassified: "red",
};

export const CATEGORIES = ["necessary", "functional", "analytics", "marketing", "unclassified"];
