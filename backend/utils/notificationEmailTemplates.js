// Type-specific email content for notifications that opt into sendEmail: true.
// Each function returns { subject, html, text } for utils/notify.js to pass
// straight through to sendNotificationEmail() - no generic "you have a
// notification" wrapper.

function wrap(headerColor, headerTitle, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${headerColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">SkillBridge</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${headerTitle}</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        ${bodyHtml}
      </div>
    </div>
  `;
}

const TEAL = 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)';
const RED = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

export function verificationApprovedEmail({ name }) {
  const subject = 'Your teacher verification was approved';
  const html = wrap(TEAL, 'Verification Approved', `
    <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
    <p style="color: #666; font-size: 16px;">Good news - your teacher verification documents have been reviewed and approved.</p>
    <p style="color: #666; font-size: 16px;">Your profile now shows a Verified badge, which helps students trust you as a teacher on SkillBridge.</p>
  `);
  const text = `Hi ${name}!\n\nYour teacher verification documents have been reviewed and approved. Your profile now shows a Verified badge.`;
  return { subject, html, text };
}

export function verificationRejectedEmail({ name, reason }) {
  const subject = 'Your teacher verification was not approved';
  const html = wrap(RED, 'Verification Update', `
    <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
    <p style="color: #666; font-size: 16px;">We reviewed your teacher verification documents and were unable to approve them this time.</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="color: #666; margin: 0;"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p style="color: #666; font-size: 16px;">You're welcome to submit updated documents for another review.</p>
  `);
  const text = `Hi ${name},\n\nWe reviewed your teacher verification documents and were unable to approve them this time.\n\nReason: ${reason}\n\nYou're welcome to submit updated documents for another review.`;
  return { subject, html, text };
}

export function refundApprovedEmail({ name, amountPaid, currency, creditsGranted }) {
  const subject = 'Your refund has been approved';
  const html = wrap(TEAL, 'Refund Approved', `
    <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
    <p style="color: #666; font-size: 16px;">Your refund request has been approved and processed through Paddle.</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #14b8a6;">
      <p style="color: #666; margin: 8px 0;"><strong>Amount refunded:</strong> ${amountPaid} ${currency}</p>
      <p style="color: #666; margin: 8px 0;"><strong>Credits deducted:</strong> ${creditsGranted}</p>
    </div>
    <p style="color: #666; font-size: 14px;">The refund will appear on your original payment method - timing depends on your bank or card issuer.</p>
  `);
  const text = `Hi ${name}!\n\nYour refund request has been approved and processed through Paddle.\n\nAmount refunded: ${amountPaid} ${currency}\nCredits deducted: ${creditsGranted}\n\nThe refund will appear on your original payment method - timing depends on your bank or card issuer.`;
  return { subject, html, text };
}

export function refundRejectedEmail({ name, reason }) {
  const subject = 'Your refund request was rejected';
  const html = wrap(RED, 'Refund Update', `
    <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
    <p style="color: #666; font-size: 16px;">We reviewed your refund request and were unable to approve it.</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="color: #666; margin: 0;"><strong>Reason:</strong> ${reason}</p>
    </div>
  `);
  const text = `Hi ${name},\n\nWe reviewed your refund request and were unable to approve it.\n\nReason: ${reason}`;
  return { subject, html, text };
}

export function payoutApprovedEmail({ name, credits, amountPKR }) {
  const subject = 'Your payout request was approved';
  const html = wrap(TEAL, 'Payout Approved', `
    <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
    <p style="color: #666; font-size: 16px;">Your payout request has been approved. We'll process the transfer and mark it paid shortly.</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #14b8a6;">
      <p style="color: #666; margin: 8px 0;"><strong>Credits:</strong> ${credits}</p>
      <p style="color: #666; margin: 8px 0;"><strong>Amount:</strong> Rs. ${amountPKR}</p>
    </div>
    <p style="color: #666; font-size: 14px;">You'll get another email as soon as the payment is sent.</p>
  `);
  const text = `Hi ${name}!\n\nYour payout request has been approved. We'll process the transfer and mark it paid shortly.\n\nCredits: ${credits}\nAmount: Rs. ${amountPKR}`;
  return { subject, html, text };
}

export function payoutRejectedEmail({ name, credits, reason }) {
  const subject = 'Your payout request was rejected';
  const html = wrap(RED, 'Payout Update', `
    <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
    <p style="color: #666; font-size: 16px;">We reviewed your payout request and were unable to approve it.</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="color: #666; margin: 0;"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p style="color: #666; font-size: 16px;">The ${credits} credits have been returned to your wallet balance.</p>
  `);
  const text = `Hi ${name},\n\nWe reviewed your payout request and were unable to approve it.\n\nReason: ${reason}\n\nThe ${credits} credits have been returned to your wallet balance.`;
  return { subject, html, text };
}

export function payoutPaidEmail({ name, credits, amountPKR, paymentReference, payoutMethod }) {
  const subject = 'Your payout has been sent';
  const html = wrap(TEAL, 'Payout Sent', `
    <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
    <p style="color: #666; font-size: 16px;">Your payout has been sent. Here are the details:</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #14b8a6;">
      <p style="color: #666; margin: 8px 0;"><strong>Credits:</strong> ${credits}</p>
      <p style="color: #666; margin: 8px 0;"><strong>Amount:</strong> Rs. ${amountPKR}</p>
      <p style="color: #666; margin: 8px 0;"><strong>Method:</strong> ${payoutMethod}</p>
      <p style="color: #666; margin: 8px 0;"><strong>Reference:</strong> ${paymentReference}</p>
    </div>
    <p style="color: #666; font-size: 14px;">If you don't see the funds yet, please check with your bank or mobile wallet using the reference above before contacting support.</p>
  `);
  const text = `Hi ${name}!\n\nYour payout has been sent.\n\nCredits: ${credits}\nAmount: Rs. ${amountPKR}\nMethod: ${payoutMethod}\nReference: ${paymentReference}\n\nIf you don't see the funds yet, please check with your bank or mobile wallet using the reference above before contacting support.`;
  return { subject, html, text };
}
