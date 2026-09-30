/**
 * Standard DPDP vendor assessment question set.
 *
 * Defined ONCE here and shared by:
 *  - the console questionnaire preview (vendors drawer)
 *  - the public vendor form at /q/[token]
 *
 * Keep this module dependency-free: it is imported by client components too.
 */
export type QuestionType = "text" | "textarea" | "yes-no";

export interface QuestionDef {
  /** Stable answer key stored in questionnaire_responses.answers_json. */
  id: string;
  /** The question text shown to the vendor. */
  label: string;
  /** Short helper text under the field. */
  hint?: string;
  type: QuestionType;
  /** Whether the form requires an answer. */
  required?: boolean;
}

export const QUESTIONNAIRE_QUESTIONS: QuestionDef[] = [
  {
    id: "data_categories",
    label: "What categories of personal data do you process on our behalf?",
    hint: "e.g. names, email addresses, phone numbers, payment details, usage logs",
    type: "textarea",
    required: true,
  },
  {
    id: "purposes",
    label: "For what purposes do you process this personal data?",
    hint: "The business purposes — be specific, one per line is fine",
    type: "textarea",
    required: true,
  },
  {
    id: "retention",
    label: "What is your data retention period?",
    hint: "e.g. 24 months after the contract ends, or on request",
    type: "text",
    required: true,
  },
  {
    id: "sub_processors",
    label: "Which sub-processors do you engage, if any?",
    hint: "Name each sub-processor and what they do. Write \"None\" if you use none.",
    type: "textarea",
  },
  {
    id: "cross_border",
    label: "Do you transfer personal data outside India? If yes, which countries?",
    hint: "Write \"No transfers — data stays in India\" if nothing leaves the country.",
    type: "text",
  },
  {
    id: "security_measures",
    label: "What security measures protect the data you process?",
    hint: "e.g. encryption at rest and in transit, access controls, audits, certifications",
    type: "textarea",
    required: true,
  },
  {
    id: "dpa_signed",
    label: "Have you signed the Data Processing Agreement with us?",
    type: "yes-no",
    required: true,
  },
  {
    id: "dpa_date",
    label: "If yes — on what date was the DPA signed?",
    hint: "YYYY-MM-DD. Leave blank if not signed.",
    type: "text",
  },
  {
    id: "breach_notification",
    label: "Describe your personal-data breach notification process.",
    hint: "How quickly you notify us, who you notify, and how",
    type: "textarea",
    required: true,
  },
  {
    id: "grievance_contact",
    label: "DPO / grievance contact",
    hint: "Name and email address of the person handling data-protection queries",
    type: "text",
    required: true,
  },
  {
    id: "dsr_handling",
    label: "How do you handle data-subject rights requests (access, correction, erasure)?",
    hint: "The workflow and turnaround time when a person exercises their rights",
    type: "textarea",
    required: true,
  },
];

export function getQuestion(id: string): QuestionDef | undefined {
  return QUESTIONNAIRE_QUESTIONS.find((q) => q.id === id);
}
