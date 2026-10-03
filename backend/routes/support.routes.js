import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendFormEmail, SUPPORT_FROM, INFO_FROM } from '../utils/emailService.js';

const router = express.Router();

const MAX_SUBJECT = 150;
const MAX_MESSAGE = 4000;
const MAX_NAME = 100;

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// Both forms render the same way; only the heading and the routing differ.
const buildEmail = ({ heading, name, email, subject, message, meta = [] }) => {
  const rows = [
    ['From', `${name} <${email}>`],
    ['Subject', subject],
    ...meta,
  ];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2A9D90; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">${escapeHtml(heading)}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 10px 10px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          ${rows
            .map(
              ([label, value]) => `
            <tr>
              <td style="padding: 6px 0; color: #575757; font-size: 13px; width: 90px;">${escapeHtml(label)}</td>
              <td style="padding: 6px 0; color: #111; font-size: 13px;">${escapeHtml(value)}</td>
            </tr>`
            )
            .join('')}
        </table>
        <div style="background: white; border-radius: 8px; padding: 16px; white-space: pre-wrap; color: #111; font-size: 14px;">${escapeHtml(
          message
        )}</div>
      </div>
    </div>
  `;

  const text = `${heading}\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}\n\n${message}`;
  return { html, text };
};

const validate = ({ name, email, subject, message }) => {
  if (!name?.trim() || !subject?.trim() || !message?.trim()) {
    return 'Name, subject and message are all required.';
  }
  if (!isEmail(email || '')) return 'Please provide a valid email address.';
  if (name.length > MAX_NAME) return 'That name is too long.';
  if (subject.length > MAX_SUBJECT) return 'That subject is too long.';
  if (message.length > MAX_MESSAGE) return 'That message is too long.';
  return null;
};

/**
 * Public contact form on the landing page. Routed to info@ - these are
 * general enquiries from people who may not have an account.
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const error = validate({ name, email, subject, message });
    if (error) return res.status(400).json({ message: error });

    const { html, text } = buildEmail({
      heading: 'New contact enquiry',
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    const sent = await sendFormEmail({
      to: INFO_FROM(),
      from: 'info',
      subject: `[Contact] ${subject.trim()}`,
      html,
      text,
      // Lets staff reply straight to the person who wrote in.
      replyTo: `${name.trim()} <${email.trim()}>`,
    });

    if (!sent) {
      return res.status(502).json({
        message: "We couldn't send your message right now. Please email us directly instead.",
      });
    }

    res.json({ success: true, message: "Thanks for reaching out - we'll get back to you soon." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * In-app support form. Routed to support@, and carries the signed-in
 * account's identity so nobody has to re-type who they are.
 */
router.post('/ticket', authenticateToken, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const user = await User.findById(req.user.userId).select('name email role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const error = validate({ name: user.name, email: user.email, subject, message });
    if (error) return res.status(400).json({ message: error });

    const { html, text } = buildEmail({
      heading: 'New support request',
      name: user.name,
      email: user.email,
      subject: subject.trim(),
      message: message.trim(),
      // Identifying the account saves a round-trip asking "which account?".
      meta: [
        ['Account', String(user._id)],
        ['Role', user.role],
      ],
    });

    const sent = await sendFormEmail({
      to: SUPPORT_FROM(),
      from: 'support',
      subject: `[Support] ${subject.trim()}`,
      html,
      text,
      replyTo: `${user.name} <${user.email}>`,
    });

    if (!sent) {
      return res.status(502).json({
        message: "We couldn't send your request right now. Please email support directly instead.",
      });
    }

    res.json({ success: true, message: "Your request has been sent - we'll reply by email." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
