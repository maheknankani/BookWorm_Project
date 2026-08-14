import nodemailer from "nodemailer";

export const sendOtpEmail = async (toEmail, otp) => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;

  let transporter;

  if (user && pass) {
    if (host) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: { user, pass },
      });
    }
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4F46E5; margin: 0;">📚 BookWorm</h2>
        <p style="color: #6B7280; font-size: 14px; margin-top: 5px;">Password Reset Request</p>
      </div>
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="font-size: 14px; color: #374151; margin-bottom: 10px;">Your One-Time Password (OTP) for resetting your password is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; margin: 15px 0;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #6B7280;">This code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
      </div>
      <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin-top: 20px;">
        If you did not request a password reset, please ignore this email.
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || "BookWorm App"}" <${user}>`,
        to: toEmail,
        subject: "BookWorm - Password Reset OTP",
        html: htmlContent,
      });
      console.log(`OTP email sent successfully to ${toEmail}`);
      return { success: true, method: "smtp" };
    } catch (error) {
      console.error("Failed to send OTP email via SMTP:", error.message);
      // Fallback log for development
      console.log("==========================================");
      console.log(`[BOOKWORM DEV FALLBACK] OTP for ${toEmail}: ${otp}`);
      console.log("==========================================");
      return { success: true, method: "fallback", message: "Logged to console due to SMTP error" };
    }
  } else {
    console.log("==========================================");
    console.log(`[BOOKWORM DEV MODE - NO SMTP CONFIG]`);
    console.log(`OTP Code for ${toEmail}: ${otp}`);
    console.log("==========================================");
    return { success: true, method: "dev_log" };
  }
};
