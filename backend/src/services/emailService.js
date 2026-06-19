const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'Spenda <onboarding@resend.dev>';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'sojanonelson54@gmail.com';
const IS_SANDBOX = process.env.NODE_ENV !== 'production';

/**
 * Send email via Resend. In sandbox mode, redirects all emails to owner.
 */
async function sendEmail({ to, subject, html }) {
  let finalTo = to;
  let finalSubject = subject;
  let sandboxBanner = '';

  if (IS_SANDBOX && to.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
    finalTo = OWNER_EMAIL;
    finalSubject = `[Test → ${to}] ${subject}`;
    sandboxBanner = `
      <div style="background:#fffbeb;border:1px solid #fef3c7;color:#92400e;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:13px;">
        <strong>Sandbox Mode:</strong> This email was intended for <strong>${to}</strong> 
        but has been redirected to the verified owner account in sandbox mode.
      </div>`;
  }

  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: finalTo,
      subject: finalSubject,
      html: sandboxBanner + html,
    });
    console.log(`[Email] Sent "${subject}" to ${finalTo} | ID: ${data.data?.id}`);
    return data;
  } catch (error) {
    console.error(`[Email] Failed to send "${subject}":`, error.message);
    throw error;
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

const baseStyle = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px; margin: 0 auto; background: #ffffff;
`;

const headerHtml = (subtitle = '') => `
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">💰 Spenda</h1>
    ${subtitle ? `<p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">${subtitle}</p>` : ''}
  </div>
`;

const footerHtml = `
  <div style="background: #f8fafc; padding: 24px 32px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Spenda · Shared Expense Tracker</p>
  </div>
`;

/**
 * Send email verification email
 */
async function sendVerificationEmail(userEmail, userName, verificationUrl) {
  const html = `
    <div style="${baseStyle}">
      ${headerHtml('Verify Your Email')}
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">Hi ${userName}! 👋</h2>
        <p style="color: #475569; line-height: 1.6;">Welcome to Spenda! Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
      </div>
      ${footerHtml}
    </div>`;
  return sendEmail({ to: userEmail, subject: 'Verify your Spenda account', html });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(userEmail, userName, resetUrl) {
  const html = `
    <div style="${baseStyle}">
      ${headerHtml('Password Reset')}
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">Hi ${userName}!</h2>
        <p style="color: #475569; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
      ${footerHtml}
    </div>`;
  return sendEmail({ to: userEmail, subject: 'Reset your Spenda password', html });
}

/**
 * Send partner invitation email
 */
async function sendPartnerInvitationEmail(receiverEmail, senderName, invitationUrl) {
  const html = `
    <div style="${baseStyle}">
      ${headerHtml('Partner Invitation')}
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">You've been invited! 🎉</h2>
        <p style="color: #475569; line-height: 1.6;">
          <strong>${senderName}</strong> has invited you to be their partner on <strong>Spenda</strong> — 
          a shared expense & savings tracker for couples.
        </p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #475569; margin: 0; font-size: 14px;">✅ Track expenses together &nbsp;·&nbsp; 💰 Monitor shared savings &nbsp;·&nbsp; 📊 View combined reports</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">If you don't have a Spenda account, you'll be prompted to create one.</p>
      </div>
      ${footerHtml}
    </div>`;
  return sendEmail({ to: receiverEmail, subject: `${senderName} invited you to Spenda!`, html });
}

/**
 * Send invitation accepted notification to sender
 */
async function sendInvitationAcceptedEmail(senderEmail, senderName, partnerName) {
  const html = `
    <div style="${baseStyle}">
      ${headerHtml('Partner Connected!')}
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">Great news, ${senderName}! 🎊</h2>
        <p style="color: #475569; line-height: 1.6;">
          <strong>${partnerName}</strong> has accepted your invitation! You're now connected as partners on Spenda.
        </p>
        <p style="color: #475569; line-height: 1.6;">You can now view each other's expenses, track combined savings, and stay within your shared budget together.</p>
      </div>
      ${footerHtml}
    </div>`;
  return sendEmail({ to: senderEmail, subject: `${partnerName} accepted your Spenda invitation!`, html });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPartnerInvitationEmail,
  sendInvitationAcceptedEmail,
};
