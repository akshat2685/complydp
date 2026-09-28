/**
 * India-aware PII classifier — rule-based, honest about what it is.
 *
 * Maps a field/column name to a PII category using keyword rules tuned for
 * Indian data (PAN, Aadhaar, UPI, IFSC, voter ID, ...). This is a deterministic
 * keyword engine, NOT machine learning; the UI labels it as such.
 */

export type PiiCategory =
  | "direct_identifier"
  | "govt_id"
  | "financial"
  | "quasi_identifier"
  | "technical"
  | "consent_record"
  | "none";

export const PII_LABELS: Record<PiiCategory, string> = {
  direct_identifier: "Direct identifier",
  govt_id: "Government ID",
  financial: "Financial",
  quasi_identifier: "Quasi-identifier",
  technical: "Technical",
  consent_record: "Consent record",
  none: "Not personal data",
};

const RULES: Array<[RegExp, PiiCategory, string]> = [
  // India-specific government IDs first (most specific wins)
  [/\b(aadhaar|aadhar|uidai)\b/i, "govt_id", "Aadhaar reference"],
  [/\bpan\b/i, "govt_id", "PAN"],
  [/\b(voter|epic)\b/i, "govt_id", "Voter ID"],
  [/\b(passport)\b/i, "govt_id", "Passport"],
  [/\b(dl_number|driving_licen[cs]e)\b/i, "govt_id", "Driving licence"],
  [/\b(gstin)\b/i, "govt_id", "GSTIN"],
  // Financial — India-flavoured
  [/\b(upi|vpa)\b/i, "financial", "UPI handle / txn id"],
  [/\b(ifsc)\b/i, "financial", "IFSC"],
  [/\b(account_no|acct_no|bank_account)\b/i, "financial", "Bank account"],
  [/\b(card_number|cc_num|credit_card)\b/i, "financial", "Card number"],
  [/\b(cvv|expiry)\b/i, "financial", "Card secret"],
  [/\b(salary|income|credit_score|cibil)\b/i, "financial", "Financial profile"],
  // Direct identifiers
  [/\b(email|e_mail)\b/i, "direct_identifier", "Email"],
  [/\b(phone|mobile|contact_no|msisdn)\b/i, "direct_identifier", "Phone"],
  [/\b(full_?name|customer_?name|first_?name|last_?name)\b/i, "direct_identifier", "Name"],
  [/\b(address|pincode|pin_code|zip)\b/i, "direct_identifier", "Address"],
  [/\b(dob|date_of_birth|birthdate)\b/i, "quasi_identifier", "Date of birth"],
  [/\b(gender|religion|caste|marital)\b/i, "quasi_identifier", "Demographic attribute"],
  // Technical
  [/\b(ip_address|\bip\b|device_id|cookie_id|user_agent|fingerprint)\b/i, "technical", "Device/network signal"],
  // Consent records
  [/\b(consent|opt_?in|opt_?out|marketing_pref)\b/i, "consent_record", "Consent record"],
];

export interface Classification {
  category: PiiCategory;
  label: string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export function classifyField(fieldName: string): Classification {
  // Word boundaries (\b) treat "_" as a word character, so snake_case names like
  // "voter_id_number" never match \bvoter\b. Normalise separators to spaces too.
  const hay = fieldName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  for (const [re, cat, reason] of RULES) {
    if (re.test(fieldName) || re.test(hay)) {
      return { category: cat, label: PII_LABELS[cat], reason, confidence: "high" };
    }
  }
  // Fallback heuristics
  if (/\b(id|identifier|number|no|code|ref)\b/i.test(fieldName)) {
    return { category: "quasi_identifier", label: PII_LABELS.quasi_identifier, reason: "Identifier-like name", confidence: "low" };
  }
  return { category: "none", label: PII_LABELS.none, reason: "No PII keywords matched", confidence: "low" };
}
