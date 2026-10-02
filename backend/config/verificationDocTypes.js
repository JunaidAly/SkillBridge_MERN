// What a teacher can attach to a verification request. The admin review screen
// shows these labels, so a reviewer knows whether they're looking at an ID or a
// degree without opening every file.
//
// Keep in sync with frontend/src/utils/verificationDocTypes.js - the values are
// what travel over the wire and get stored.
export const VERIFICATION_DOC_TYPES = [
  { value: 'cnic', label: 'CNIC / National ID' },
  { value: 'degree', label: 'Degree certificate' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'cv', label: 'CV / Resume' },
  { value: 'teaching_certificate', label: 'Teaching certificate' },
  { value: 'experience_letter', label: 'Experience letter' },
  { value: 'portfolio', label: 'Portfolio / work sample' },
  { value: 'other', label: 'Other' },
];

export const VERIFICATION_DOC_TYPE_VALUES = VERIFICATION_DOC_TYPES.map((t) => t.value);

export const DEFAULT_VERIFICATION_DOC_TYPE = 'other';

export const isValidDocType = (value) => VERIFICATION_DOC_TYPE_VALUES.includes(value);
