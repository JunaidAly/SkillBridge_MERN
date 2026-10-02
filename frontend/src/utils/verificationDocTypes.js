// Keep the values in sync with backend/config/verificationDocTypes.js - the
// backend validates against its own copy and falls back to 'other'.
//
// The upload form renders one slot per entry, so the order here is the order a
// teacher is asked for things: identity first, then credentials, then extras.
export const VERIFICATION_DOC_TYPES = [
  {
    value: "cnic",
    label: "CNIC / National ID",
    hint: "Front side, clearly readable",
    recommended: true,
  },
  {
    value: "degree",
    label: "Degree certificate",
    hint: "Your highest relevant qualification",
    recommended: true,
  },
  {
    value: "transcript",
    label: "Transcript",
    hint: "Marksheet or academic record",
  },
  {
    value: "cv",
    label: "CV / Resume",
    hint: "Your current CV",
  },
  {
    value: "teaching_certificate",
    label: "Teaching certificate",
    hint: "Any teaching or training qualification",
  },
  {
    value: "experience_letter",
    label: "Experience letter",
    hint: "From a previous employer or institute",
  },
  {
    value: "portfolio",
    label: "Portfolio / work sample",
    hint: "Work that shows your skill",
  },
  {
    value: "other",
    label: "Other",
    hint: "Anything else that supports your application",
  },
];

export const DEFAULT_VERIFICATION_DOC_TYPE = "other";

const LABELS = Object.fromEntries(VERIFICATION_DOC_TYPES.map((t) => [t.value, t.label]));

export const docTypeLabel = (value) => LABELS[value] || "Document";
