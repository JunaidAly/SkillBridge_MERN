// Single source of truth for session credit amounts and wallet defaults -
// shared by credits.routes.js and utils/meetingCompletion.js so the two
// never drift apart.
export const CREDITS_PER_TEACHING_SESSION = 25;
export const CREDITS_PER_LEARNING_SESSION = 25;
export const LOW_BALANCE_THRESHOLD = 20;
