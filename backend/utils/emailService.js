import nodemailer from 'nodemailer';

export async function sendVerificationCode(email, code) {
  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  // If SMTP is not configured, log to console (for development)
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('='.repeat(50));
    console.log(`📧 Verification Code for ${email}: ${code}`);
    console.log('='.repeat(50));
    console.log('⚠️  SMTP not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env to send emails.');
    return true;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // For Gmail, you might need to use OAuth2 or App Password
      // For other providers, adjust settings accordingly
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"SkillBridge" <${smtpFrom}>`,
      to: email,
      subject: 'SkillBridge Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">SkillBridge</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>
            <p style="color: #666; font-size: 16px;">Please use the following code to verify your account:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 0;">${code}</p>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `,
      text: `Your SkillBridge verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    });

    console.log('✅ Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    // Fallback to console logging if email fails
    console.log('='.repeat(50));
    console.log(`📧 Verification Code for ${email}: ${code}`);
    console.log('='.repeat(50));
    return true; // Return true to not block the registration/login flow
  }
}

