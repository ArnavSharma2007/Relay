import nodemailer from 'nodemailer';

export async function sendInviteEmail(data: {
  customerName: string;
  customerEmail: string;
  sessionCode: string;
  inviteCode: string;
  inviteLink: string;
}) {
  const { customerName, customerEmail, sessionCode, inviteCode, inviteLink } = data;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  let from = process.env.SMTP_FROM || 'RELAY Support <noreply@relay.io>';

  if (host === 'smtp.resend.com' && !process.env.SMTP_FROM) {
    from = 'RELAY Support <onboarding@resend.dev>';
  }

  let transporter;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Fallback: console print and test using Ethereal
    console.log('\n==================================================');
    console.log('✉️  EMAIL INVITATION (MOCK LOG)');
    console.log(`To: ${customerEmail}`);
    console.log(`Subject: Your RELAY Video Support Session Invite [${sessionCode}]`);
    console.log(`Session Code: ${sessionCode}`);
    console.log(`Invite Code: ${inviteCode}`);
    console.log(`Join Link: ${inviteLink}`);
    console.log('==================================================\n');

    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn('Could not create Ethereal test account, skipping SMTP mock sending.');
      return;
    }
  }

  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #0d0f1a; border: 1px solid #1e293b; border-radius: 16px; color: #f8fafc;">
      <!-- Logo Header -->
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #0d0f1a; font-size: 20px; text-align: center; line-height: 36px;">
          R
        </div>
        <span style="font-size: 22px; font-weight: 700; letter-spacing: 0.05em; color: #10b981; margin-left: 8px;">RELAY</span>
      </div>

      <!-- Welcome Banner -->
      <h2 style="font-size: 20px; font-weight: 600; color: #f8fafc; margin-top: 0; margin-bottom: 12px;">Hello ${customerName},</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
        You have been invited to a secure, real-time video support session on RELAY. Our agent is ready to assist you.
      </p>

      <!-- Invitation Card -->
      <div style="background-color: #151828; border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 12px;">
          <tr>
            <td>
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Session Code</span>
              <span style="font-family: monospace; font-size: 15px; color: #34d399; font-weight: bold;">${sessionCode}</span>
            </td>
            <td style="text-align: right;">
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Invite Code</span>
              <span style="font-family: monospace; font-size: 15px; color: #34d399; font-weight: bold;">${inviteCode}</span>
            </td>
          </tr>
        </table>
        
        <p style="font-size: 13px; line-height: 1.5; color: #94a3b8; margin: 0 0 16px 0;">
          To join, simply click the button below to connect instantly. No installation or registration is required.
        </p>
        
        <div style="text-align: center;">
          <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #0d0f1a; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px;">
            Join Video Call
          </a>
        </div>
      </div>

      <!-- Grace Window Warning / Instructions -->
      <div style="font-size: 13px; line-height: 1.5; color: #64748b; background-color: #151828; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 3px solid #10b981;">
        <strong>💡 Accidentally Disconnected?</strong><br/>
        Don't worry! If your connection drops, you can click the button above or enter your invite code on the homepage within a short grace period to rejoin your active session seamlessly.
      </div>

      <!-- Footer -->
      <p style="font-size: 12px; color: #475569; margin: 0; text-align: center;">
        This email was automatically generated by RELAY Support. Please do not reply directly to this email.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: customerEmail,
      subject: `Your RELAY Video Support Session Invite [${sessionCode}]`,
      text: `Hello ${customerName},\n\nYou have been invited to a RELAY support session.\n\nSession Code: ${sessionCode}\nInvite Code: ${inviteCode}\n\nJoin Link: ${inviteLink}\n\nBest regards,\nRELAY Team`,
      html,
    });

    if (!host) {
      console.log(`✉️ Mock Invite Email Sent! Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`✉️ Invite Email successfully sent to ${customerEmail}. Message ID: ${info.messageId}`);
    }
  } catch (err) {
    console.error('Error sending invite email:', err);
  }
}
