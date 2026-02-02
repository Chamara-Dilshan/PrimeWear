import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "PrimeWear <noreply@primewear.lk>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "PrimeWear";

export const emailService = {
  /**
   * Send OTP email for customer login
   */
  async sendOTPEmail(to: string, otp: string, expiryMinutes: number) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `Your ${APP_NAME} Login Code`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Your Login Code</h2>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Use the code below to complete your login. This code will expire in ${expiryMinutes} minutes.</p>

              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px; background-color: #f4f4f5; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: 700; color: #18181b; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send OTP email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending OTP email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send welcome email to new vendor with credentials
   */
  async sendVendorWelcomeEmail(
    to: string,
    businessName: string,
    email: string,
    tempPassword: string
  ) {
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/vendor/login`;

      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `Welcome to ${APP_NAME} - Your Vendor Account`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Welcome, ${businessName}!</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Your vendor account has been created. You can now start selling on ${APP_NAME}.</p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 30px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                    <p style="margin: 0 0 15px; color: #92400e; font-size: 14px; font-weight: 600;">Your Login Credentials:</p>
                    <p style="margin: 0 0 8px; color: #78350f; font-size: 14px;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 0; color: #78350f; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background-color: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace;">${tempPassword}</code></p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">⚠️ <strong>Important:</strong> You will be required to change your password on your first login for security purposes.</p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Login to Your Account</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">If you have any questions or need assistance, please contact our support team.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send vendor welcome email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending vendor welcome email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(to: string, userName: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Password Changed`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Password Changed</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hello ${userName},</p>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Your password has been successfully changed. If you made this change, no further action is required.</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">⚠️ If you didn't make this change, please contact support immediately as your account may be compromised.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send password changed email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending password changed email:", error);
      return { success: false, error };
    }
  },
};
