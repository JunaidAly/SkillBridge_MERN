// Checks that the configured SMTP account can actually authenticate and send
// as the addresses the app uses. Run it after changing mail settings, before
// trusting that verification codes and support replies are going out.
//
//   node scripts/testEmail.js                      # connection + auth only
//   node scripts/testEmail.js you@example.com      # also sends two test emails
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodemailer from 'nodemailer';
import { SUPPORT_FROM, INFO_FROM, sendFormEmail } from '../utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const recipient = process.argv[2];

function describeConfig() {
  const rows = [
    ['SMTP_HOST', process.env.SMTP_HOST],
    ['SMTP_PORT', process.env.SMTP_PORT],
    ['SMTP_SECURE', process.env.SMTP_SECURE],
    ['SMTP_USER', process.env.SMTP_USER],
    ['SMTP_PASS', process.env.SMTP_PASS ? `set (${process.env.SMTP_PASS.length} chars)` : 'MISSING'],
    ['SUPPORT_EMAIL', SUPPORT_FROM()],
    ['INFO_EMAIL', INFO_FROM()],
    ['RESEND_API_KEY', process.env.RESEND_API_KEY ? 'set' : 'not set'],
  ];
  console.log('Mail configuration:');
  rows.forEach(([k, v]) => console.log(`  ${k.padEnd(14)} ${v || 'MISSING'}`));
  console.log(
    `
Transport in use: ${
      process.env.RESEND_API_KEY ? 'Resend (HTTPS) - SMTP settings are ignored' : 'SMTP'
    }
`
  );
}

async function main() {
  describeConfig();

  // Resend needs no connection check - it is a plain HTTPS call, which is the
  // whole reason it works where SMTP is blocked. Send a real message instead.
  if (process.env.RESEND_API_KEY) {
    if (!recipient) {
      console.log('Pass an email address to send a test message:');
      console.log('  node scripts/testEmail.js you@example.com');
      return;
    }
    for (const [label, from] of [['support', SUPPORT_FROM()], ['info', INFO_FROM()]]) {
      const ok = await sendFormEmail({
        to: recipient,
        from: label,
        subject: `SkillBridge test (${label})`,
        html: `<p>This confirms mail can be sent as ${from}.</p>`,
        text: `This confirms mail can be sent as ${from}.`,
      });
      console.log(`${ok ? '✅ Sent' : '❌ Failed'} as ${from}`);
      if (!ok) console.log('   Check the domain is verified in Resend and the From matches it.');
    }
    return;
  }

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('❌ SMTP_HOST, SMTP_USER and SMTP_PASS must all be set.');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
  });

  try {
    await transporter.verify();
    console.log('✅ Connected and authenticated.\n');
  } catch (err) {
    console.error('❌ Could not authenticate:', err.message);
    console.error('\nCommon causes:');
    console.error('  - Using the account password instead of an app-specific password');
    console.error('  - Wrong port/secure pair (465 needs SMTP_SECURE=true, 587 needs false)');
    console.error('  - SMTP access not enabled for the mailbox');
    process.exit(1);
  }

  if (!recipient) {
    console.log('Pass an email address to also send test messages:');
    console.log('  node scripts/testEmail.js you@example.com');
    return;
  }

  // Sending as BOTH identities matters: a provider will refuse a From it does
  // not own, so info@ failing here means it is not a verified alias yet.
  for (const [label, from] of [['support', SUPPORT_FROM()], ['info', INFO_FROM()]]) {
    try {
      const info = await transporter.sendMail({
        from: `"SkillBridge" <${from}>`,
        to: recipient,
        subject: `SkillBridge test (${label})`,
        text: `This confirms mail can be sent as ${from}.`,
      });
      console.log(`✅ Sent as ${from} -> ${info.messageId}`);
    } catch (err) {
      console.error(`❌ Could NOT send as ${from}: ${err.message}`);
      console.error(`   ${from} likely isn't an address this SMTP account may send as.`);
    }
  }

  console.log('\nCheck the inbox - confirm the From shown is the domain address, not the SMTP login.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
