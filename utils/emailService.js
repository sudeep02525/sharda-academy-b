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
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const data = await resend.emails.send({
      from: `Sharda Academy <${fromEmail}>`,
      to: [email],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Sharda Academy</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for ${context.replace('-', ' ')} is:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; background: #f4f4f4; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error };
  }
};
