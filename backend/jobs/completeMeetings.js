import cron from 'node-cron';
import { runMeetingCompletionSweep } from '../utils/meetingCompletion.js';

// Ensures meetings get marked completed, and their credits eventually
// finalized after the 24h dispute window, even if neither participant visits
// the app - relying only on the GET /meetings fast-path would leave those
// stuck as 'scheduled' or with credits never finalized.
export function startMeetingCompletionJob() {
  cron.schedule('*/5 * * * *', () => {
    runMeetingCompletionSweep().catch((err) => console.error('completeMeetings job failed:', err.message));
  });
}
