/**
 * complyDP — Lightweight Web Consent Runtime
 * Minimal footprint SDK deployed on web properties (e.g. asterpay.in) to intercept cookies,
 * enforce prior affirmative opt-in under DPDP Section 6, and log auditable pseudonymous events.
 */

export interface ConsentPreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  functional: boolean;
  advertising: boolean;
}

export interface ConsentConfig {
  tenantId: string;
  propertyId: string;
  bannerVersion: string;
  policyVersion: string;
  endpointUrl: string;
}

export class ComplyDPConsentRuntime {
  private config: ConsentConfig;
  private currentPreferences: ConsentPreferences = {
    necessary: true,
    analytics: false,
    functional: false,
    advertising: false,
  };
  private visitorRef: string;

  constructor(config: ConsentConfig) {
    this.config = config;
    this.visitorRef = this.getOrCreateVisitorRef();
  }

  private getOrCreateVisitorRef(): string {
    if (typeof window === "undefined") return "anon_node_environment";
    let ref = localStorage.getItem("complydp_visitor_ref");
    if (!ref) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      const hex = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
      ref = `anon_sha256_${hex}`;
      localStorage.setItem("complydp_visitor_ref", ref);
    }
    return ref;
  }

  public getPreferences(): ConsentPreferences {
    return { ...this.currentPreferences };
  }

  public isCategoryAllowed(category: keyof ConsentPreferences): boolean {
    if (category === "necessary") return true;
    return !!this.currentPreferences[category];
  }

  public grantConsent(categories: Partial<ConsentPreferences>): void {
    this.currentPreferences = {
      ...this.currentPreferences,
      ...categories,
      necessary: true,
    };
    this.emitConsentEvent("consent_granted");
  }

  public withdrawAll(): void {
    this.currentPreferences = {
      necessary: true,
      analytics: false,
      functional: false,
      advertising: false,
    };
    this.emitConsentEvent("consent_withdrawn");
  }

  private emitConsentEvent(
    eventType: "consent_granted" | "consent_denied" | "consent_withdrawn" | "preference_changed"
  ): void {
    const payload = {
      tenantId: this.config.tenantId,
      propertyId: this.config.propertyId,
      eventType,
      visitorRef: this.visitorRef,
      categories: Object.keys(this.currentPreferences).filter(
        (k) => this.currentPreferences[k as keyof ConsentPreferences]
      ),
      bannerVersion: this.config.bannerVersion,
      policyVersion: this.config.policyVersion,
      timestamp: new Date().toISOString(),
    };

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(this.config.endpointUrl, JSON.stringify(payload));
    }
  }
}
