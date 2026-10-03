// The single place that decides what an unverified account may and may not do.
//
// The rule is deliberately NOT "verified or nothing". Review is manual, so a
// blanket block would park every new signup behind an admin queue, and asking
// for a national ID before the user has seen anything working is the surest way
// to lose them. Instead the gate sits where the risk actually is - money, and
// one-on-one sessions with a stranger - and everything upstream of that stays
// open:
//
//   open to everyone      browse, search, chat, buy credits, one free trial
//   verified only         teaching, booking past the free trial, cashing out
//
// So a user tastes the product first and is asked for ID at the moment they
// commit. Tighten or loosen by editing this file - nothing else hard-codes the
// policy.

/** Statuses that count as "identity confirmed". */
const VERIFIED_STATUSES = ['verified'];

export const isVerified = (user) => VERIFIED_STATUSES.includes(user?.verificationStatus);

/** True once docs are in and awaiting review - gated like unverified, but the UI says so differently. */
export const isAwaitingReview = (user) => user?.verificationStatus === 'pending';

/**
 * Docs required before a submission is accepted, by what the user does.
 *
 * Everyone proves who they are (CNIC). A teacher additionally proves they can
 * teach, because that is the claim students are paying against - any ONE of the
 * credential types is enough, since a self-taught designer with a portfolio is
 * as real as a graduate with a transcript.
 */
export const REQUIRED_DOC_TYPES = {
  identity: 'cnic',
  teachingCredentials: ['degree', 'transcript', 'teaching_certificate', 'experience_letter', 'portfolio'],
};

/** A user who lists skills to teach is held to the teacher requirements. */
export const isTeachingAccount = (user) => (user?.skillsTeaching?.length || 0) > 0;

/**
 * Checks an upload against the requirements for this account.
 * Returns null when fine, or a message explaining what is missing.
 */
export function describeMissingDocs(user, docTypes) {
  const provided = new Set(docTypes);

  if (!provided.has(REQUIRED_DOC_TYPES.identity)) {
    return 'A CNIC or national ID is required so we can confirm who you are.';
  }

  if (isTeachingAccount(user)) {
    const hasCredential = REQUIRED_DOC_TYPES.teachingCredentials.some((t) => provided.has(t));
    if (!hasCredential) {
      return 'Because you teach, add at least one credential as well - a degree, transcript, teaching certificate, experience letter or portfolio.';
    }
  }

  return null;
}

// --------------------------------------------------------------------------
// Action gates. Each returns null to allow, or { code, message } to refuse.
// The code lets the frontend route the user straight to the right screen
// instead of parsing prose.
// --------------------------------------------------------------------------

const refusal = (user, message) => ({
  code: isAwaitingReview(user) ? 'VERIFICATION_PENDING' : 'VERIFICATION_REQUIRED',
  message: isAwaitingReview(user)
    ? "Your documents are still being reviewed. We'll email you as soon as that's done."
    : message,
});

/** Teaching: the whole trust promise of the product rests on this one. */
export function checkCanTeach(user) {
  if (isVerified(user)) return null;
  return refusal(user, 'Verify your identity before taking teaching sessions.');
}

/** Being booked BY someone else - phrased for the student who is doing the booking. */
export function checkCanBeBooked(teacher) {
  if (isVerified(teacher)) return null;
  return {
    code: 'TEACHER_NOT_VERIFIED',
    message: `${teacher?.name || 'This teacher'} hasn't completed identity verification yet, so they can't be booked.`,
  };
}

/**
 * Booking a paid session as a student. The free trial is exempt on purpose -
 * it is the one thing an unverified user may do, and it is what earns us the
 * right to ask for their ID afterwards.
 */
export function checkCanBookPaidSession(user) {
  if (isVerified(user)) return null;
  return refusal(user, 'Verify your identity to book sessions beyond your free trial.');
}

/** Money leaving the platform. No exemptions - this one is KYC, not UX. */
export function checkCanCashOut(user) {
  if (isVerified(user)) return null;
  return refusal(user, 'Verify your identity before cashing out. This protects both you and the people you taught.');
}
