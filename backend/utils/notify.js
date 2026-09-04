import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendNotificationEmail } from './emailService.js';

let ioInstance = null;

// server.js calls this once at startup so notify.js can emit without needing
// access to req.app (this fires from places that aren't inside a request,
// e.g. the meeting-reminder cron job).
export function setSocketIO(io) {
  ioInstance = io;
}

/**
 * Creates a Notification, emits it in real time to the recipient if they're
 * connected, and optionally emails them. Never throws - a notification
 * failure must not break whatever business action triggered it.
 *
 * emailContent lets callers (Part D trigger points) supply a specific
 * subject/html/text instead of the generic title/body fallback.
 */
export async function notifyUser({ userId, type, title, body, link, sendEmail = false, emailContent = null }) {
  try {
    const notification = await Notification.create({ user: userId, type, title, body, link });

    try {
      if (ioInstance) {
        ioInstance.to(`user:${userId}`).emit('newNotification', {
          id: notification._id.toString(),
          type: notification.type,
          title: notification.title,
          body: notification.body,
          link: notification.link,
          read: notification.read,
          createdAt: notification.createdAt,
        });
      }
    } catch (socketErr) {
      console.error('notifyUser: socket emit failed:', socketErr.message);
    }

    if (sendEmail) {
      try {
        const user = await User.findById(userId).select('email name');
        if (user?.email) {
          const subject = emailContent?.subject || title;
          const html = emailContent?.html || `<p>${body || title}</p>`;
          const text = emailContent?.text || body || title;
          await sendNotificationEmail(user.email, subject, html, text);
        }
      } catch (emailErr) {
        console.error('notifyUser: email send failed:', emailErr.message);
      }
    }

    return notification;
  } catch (err) {
    console.error('notifyUser: failed to create notification:', err.message);
    return null;
  }
}
