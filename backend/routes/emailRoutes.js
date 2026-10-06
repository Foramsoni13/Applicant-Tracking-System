import express from "express";
import { verifySmtpConnection, sendTestEmail, sendEmail } from "../services/emailService.js";

const router = express.Router();

// GET /api/email/verify - Safe SMTP configuration check
router.get("/verify", async (req, res) => {
  try {
    const result = await verifySmtpConnection();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Gmail SMTP verification failed: ${error.message}`,
    });
  }
});

// POST /api/email/test - Sends test email from process.env.EMAIL_USER to process.env.TEST_EMAIL
router.post("/test", async (req, res) => {
  try {
    console.log("[POST /api/email/test] Triggered email test request...");
    const result = await sendTestEmail();

    if (result.success) {
      return res.json({
        success: true,
        message: "Test email sent successfully to process.env.TEST_EMAIL",
        messageId: result.messageId,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send test email",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[POST /api/email/test Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Server error sending test email",
      error: error.message,
    });
  }
});

// POST /api/email/send - Sends email to single or multiple recipients (to, cc, bcc)
router.post("/send", async (req, res) => {
  try {
    const { to, cc, bcc, subject, text, html, hrName, companyName, hrEmail, useBccForMultiple } = req.body;
    console.log("[POST /api/email/send] Request body:", req.body);

    const result = await sendEmail({
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      hrName,
      companyName,
      hrEmail,
      useBccForMultiple,
    });

    if (result.success) {
      return res.json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
        recipients: result.recipients,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.reason || result.error || "Failed to send email",
      });
    }
  } catch (error) {
    console.error("[POST /api/email/send Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Server error sending email",
      error: error.message,
    });
  }
});

export default router;
