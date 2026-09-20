import nodemailer from 'nodemailer';

/**
 * Send password reset email to user using HTTP API (Resend / SendGrid - works on Render) or SMTP / Simulator
 * @param {string} toEmail - Recipient email address
 * @param {string} resetCode - 6-digit verification code
 * @param {string} userName - Full name of the user
 */
export async function sendPasswordResetEmail(toEmail, resetCode, userName = 'GlucoTrack User') {
  const resendApiKey = process.env.RESEND_API_KEY;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  const subject = '🔐 GlucoTrack AI - Your Password Reset Verification Code';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border-radius: 12px; line-height: 48px; color: #ffffff; font-size: 24px; font-weight: bold;">
          🩸
        </div>
        <h2 style="color: #0f172a; margin-top: 12px; margin-bottom: 4px; font-size: 20px; font-weight: 800;">GlucoTrack AI</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Smart Diabetes & Glucose Monitoring</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #f1f5f9;">
        <p style="color: #334155; font-size: 15px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">We received a request to reset your password for your GlucoTrack AI account. Use the 6-digit verification code below to set a new password:</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background-color: #e0f2fe; color: #0284c7; border: 2px dashed #0284c7; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 12px 28px; border-radius: 8px;">
            ${resetCode}
          </div>
        </div>

        <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">⏱️ This verification code is valid for <strong>60 minutes</strong>. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>

      <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">GlucoTrack AI Inc. • Secure Patient Glucose Analytics</p>
      </div>
    </div>
  `;

  // 1. Resend HTTP API (Port 443 HTTPS - Works on Render)
  if (resendApiKey) {
    try {
      console.log(`[Email Service]: Sending email via Resend HTTP API to ${toEmail}...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject,
          html: htmlContent,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Email Service]: Email delivered via Resend HTTP API. ID: ${data.id}`);
        return { success: true, id: data.id, mode: 'resend_http' };
      } else {
        console.error('[Email Service Error - Resend]:', data);
      }
    } catch (err) {
      console.error('[Email Service Exception - Resend]:', err.message);
    }
  }

  // 2. SendGrid HTTP API (Port 443 HTTPS - Works on Render)
  if (sendgridApiKey) {
    try {
      console.log(`[Email Service]: Sending email via SendGrid HTTP API to ${toEmail}...`);
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: fromEmail.includes('<') ? fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail : fromEmail },
          subject,
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });

      if (response.ok || response.status === 202) {
        console.log(`[Email Service]: Email queued via SendGrid HTTP API.`);
        return { success: true, mode: 'sendgrid_http' };
      } else {
        const errorText = await response.text();
        console.error('[Email Service Error - SendGrid]:', errorText);
      }
    } catch (err) {
      console.error('[Email Service Exception - SendGrid]:', err.message);
    }
  }

  // 3. SMTP (Nodemailer - Port 587 / 465)
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const info = await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[Email Service]: Sent reset email via SMTP to ${toEmail}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, mode: 'smtp' };
    } catch (err) {
      console.error('[Email Service Error - SMTP]:', err.message);
    }
  }

  // 4. Simulator / Fallback Mode (Logs to server console & demo banner)
  console.log(`=======================================================`);
  console.log(` 📧 [EMAIL SERVICE SIMULATOR - DEV & RENDER DEMO MODE]`);
  console.log(` 📩 To: ${toEmail}`);
  console.log(` 🔑 Reset Code: ${resetCode}`);
  console.log(` 💡 Tip for Render: Set RESEND_API_KEY in Render Environment Variables!`);
  console.log(`=======================================================`);
  return { success: true, mode: 'simulator' };
}
