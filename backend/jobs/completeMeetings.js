import cron from 'node-cron';
import { completeExpiredMeetings } from '../utils/meetingCompletion.js';

// Ensures meetings get marked completed (and their credits processed) even if
// neither participant visits the app after the session's end time - relying
// only on the GET /meetings fast-path would leave those stuck as 'scheduled'.
export function startMeetingCompletionJob() {
  cron.schedule('*/5 * * * *', () => {
    completeExpiredMeetings().catch((err) => console.error('completeMeetings job failed:', err.message));
  });
}
