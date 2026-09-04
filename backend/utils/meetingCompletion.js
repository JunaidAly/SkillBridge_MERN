import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import { CreditTransaction } from '../models/Credit.js';
import { getOrCreateWallet, notifyIfCrossedLowBalance } from './wallet.js';
import { CREDITS_PER_TEACHING_SESSION, CREDITS_PER_LEARNING_SESSION } from '../config/sessionCreditRates.js';

// A meeting's sessionType is always taken from the creator's own perspective
// at booking time (see frontend SchedulePanel.jsx). This is the single source
// of truth for "who is teaching vs learning" - reuse it everywhere instead of
// re-deriving it.
export function getSessionRoles(meeting) {
  const teacherId = meeting.sessionType === 'teaching'
    ? meeting.createdBy
    : meeting.participants.find((p) => String(p) !== String(meeting.createdBy));
  const learnerId = meeting.sessionType === 'learning'
    ? meeting.createdBy
    : meeting.participants.find((p) => String(p) !== String(meeting.createdBy));
  return { teacherId, learnerId };
}

export async function updateUserStatsForMeeting(meeting) {
  if (!meeting.skill) return;

  const { teacherId, learnerId } = getSessionRoles(meeting);

  if (teacherId) {
    const teacher = await User.findById(teacherId);
    if (teacher) {
      const skillIndex = teacher.skillsTeaching.findIndex(
        (s) => s.name.toLowerCase() === meeting.skill.toLowerCase()
      );
      if (skillIndex >= 0) {
        teacher.skillsTeaching[skillIndex].sessions += 1;
      }
      teacher.stats.sessionsTaught = (teacher.stats.sessionsTaught || 0) + 1;
      await teacher.save();
    }
  }

  if (learnerId) {
    const learner = await User.findById(learnerId);
    if (learner) {
      learner.stats.sessionsLearned = (learner.stats.sessionsLearned || 0) + 1;
      await learner.save();
    }
  }
}

// Credits move only once a session actually completes (its scheduled end time
// has passed while it was still 'scheduled') - never at booking time. A
// cancelled meeting never reaches 'completed', so nothing is ever charged for
// it and no refund/reversal system is needed as a result.
export async function processCompletedMeetingCredits(meeting) {
  if (meeting.creditsProcessed) return;

  const { teacherId, learnerId } = getSessionRoles(meeting);
  if (!teacherId || !learnerId) {
    meeting.creditsProcessed = true;
    await meeting.save();
    return;
  }

  const learnerWallet = await getOrCreateWallet(learnerId);

  if (learnerWallet.balance < CREDITS_PER_LEARNING_SESSION) {
    // The learner can't afford it even now that the session is over - no
    // credits move on either side. Mark processed so this doesn't retry
    // forever, and leave a visible note on the meeting.
    meeting.creditsProcessed = true;
    meeting.creditsNote = 'Learner had insufficient balance when the session completed; no credits were transferred.';
    await meeting.save();
    return;
  }

  const teacherWallet = await getOrCreateWallet(teacherId);

  const learnerBalanceBefore = learnerWallet.balance;
  learnerWallet.balance -= CREDITS_PER_LEARNING_SESSION;
  learnerWallet.totalSpent += CREDITS_PER_LEARNING_SESSION;
  await learnerWallet.save();
  notifyIfCrossedLowBalance(learnerId, learnerBalanceBefore, learnerWallet.balance);

  teacherWallet.balance += CREDITS_PER_TEACHING_SESSION;
  teacherWallet.totalEarned += CREDITS_PER_TEACHING_SESSION;
  await teacherWallet.save();

  await CreditTransaction.create([
    {
      user: teacherId,
      type: 'teaching',
      amount: CREDITS_PER_TEACHING_SESSION,
      description: 'Teaching session completed',
      meeting: meeting._id,
      otherUser: learnerId,
    },
    {
      user: learnerId,
      type: 'learning',
      amount: -CREDITS_PER_LEARNING_SESSION,
      description: 'Learning session completed',
      meeting: meeting._id,
      otherUser: teacherId,
    },
  ]);

  meeting.creditsProcessed = true;
  await meeting.save();
}

// Marks any 'scheduled' meeting whose end time has passed as 'completed',
// updates stats, and processes its credits. Global (not scoped to one user)
// so a periodic job can run it independently of anyone visiting their
// dashboard - relying only on a user's own GET /meetings call would mean a
// meeting between two people who never revisit the app never gets completed.
export async function completeExpiredMeetings() {
  const now = new Date();
  const candidates = await Meeting.find({ status: 'scheduled', startsAt: { $lte: now } });

  for (const meeting of candidates) {
    const endTime = new Date(meeting.startsAt.getTime() + (meeting.duration || 60) * 60 * 1000);
    if (now > endTime) {
      meeting.status = 'completed';
      await meeting.save();
      await updateUserStatsForMeeting(meeting);
      await processCompletedMeetingCredits(meeting);
    }
  }
}
