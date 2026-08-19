import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
// NOTE: Ensure RESEND_API_KEY is set in .env file
// And RESEND_FROM_EMAIL is set (e.g., 'onboarding@resend.dev' for testing)

export const sendOTP = async (email, otp, context) => {
  let subject = 'Your OTP Code';
  if (context === 'forgot-password') {
    subject = 'Password Reset OTP - Sharda Academy';
  } else if (context === 'admin-login' || context === 'cms-login') {
    subject = 'Admin Access OTP - Sharda Academy';
  } else if (context === 'student-login') {
    subject = 'Login OTP - Sharda Academy';
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@shardaacademyofficial.in';
    const { data, error } = await resend.emails.send({
      from: `Sharda Academy <${fromEmail}>`,
      to: [email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; margin: 0; padding: 40px 20px; color: #1e293b;">
          
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
            
            <!-- Header with Logo -->
            <tr>
              <td style="padding: 25px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <img src="https://res.cloudinary.com/ybzctfb3/image/upload/v1784214512/sharda-academy/uploads/chl3yks6plrwp1ufvdkc.png" alt="Sharda Academy Logo" style="max-width: 140px; height: auto;">
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 35px 30px; text-align: center;">
                <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 15px 0;">Security Verification</h2>
                
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 25px 0;">
                  You are receiving this email because a request was made for <strong>${context.replace('-', ' ')}</strong> on your account. Please use the verification code below to proceed.
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px; margin-bottom: 25px;">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <span style="display: block; font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Your One-Time Password</span>
                      <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 38px; font-weight: 800; color: #0a1835; letter-spacing: 4px; margin: 0;">${otp}</div>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-left: 3px solid #cbd5e1; border-radius: 2px;">
                  <tr>
                    <td style="padding: 15px; text-align: left; font-size: 13px; color: #64748b; line-height: 1.5;">
                      <strong>Note:</strong> This code is valid for only <strong>10 minutes</strong>. Do not share this code with anyone. If you did not initiate this request, please secure your account immediately.
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #0a1835; padding: 20px 30px; text-align: center;">
                <p style="margin: 0 0 5px 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Sharda Academy. All rights reserved.</p>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8;">This is an automated message, please do not reply.</p>
                <a href="https://shardaacademyofficial.in" style="color: #f1af3c; text-decoration: none; font-size: 12px; font-weight: 600;">Visit Student Portal</a>
              </td>
            </tr>

          </table>

        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error from Resend API:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error sending OTP email:', err);
    return { success: false, error: err };
  }
};
