import cron from 'node-cron';
import Meeting from '../models/Meeting.js';
import { notifyUser } from '../utils/notify.js';

const REMINDER_WINDOW_MINUTES = 30;

async function sendDueReminders() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);

  const dueMeetings = await Meeting.find({
    status: 'scheduled',
    reminderSent: false,
    startsAt: { $gte: now, $lte: windowEnd },
  });

  for (const meeting of dueMeetings) {
    for (const participantId of meeting.participants) {
      notifyUser({
        userId: participantId,
        type: 'meeting_reminder',
        title: `Upcoming session: ${meeting.title}`,
        body: `Starts at ${meeting.startsAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
        link: `/meetings/${meeting._id}/call`,
      });
    }

    meeting.reminderSent = true;
    await meeting.save();
  }
}

export function startMeetingReminderJob() {
  // Every 5 minutes.
  cron.schedule('*/5 * * * *', () => {
    sendDueReminders().catch((err) => console.error('meetingReminders job failed:', err.message));
  });
}

// Exported for direct testing (e.g. calling it once from a script instead of
// waiting on the cron schedule).
export { sendDueReminders };
