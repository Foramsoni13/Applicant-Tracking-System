import nodemailer from "nodemailer";

// Single reusable Nodemailer transporter instance
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

/**
 * Verifies the Gmail SMTP connection configuration without exposing credentials.
 */
export const verifySmtpConnection = async () => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;

    console.log("EMAIL_USER:", user);
    console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
    console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
    console.log("EMAIL_PASSWORD_EXISTS:", !!pass);

    if (!user || !pass || pass === "ADD_MY_GOOGLE_APP_PASSWORD_HERE") {
      console.log("❌ Gmail SMTP connection failed: EMAIL_APP_PASSWORD is not configured (placeholder present).");
      return {
        success: false,
        message: "Gmail SMTP configuration incomplete: EMAIL_APP_PASSWORD placeholder active",
      };
    }

    await transporter.verify();
    console.log("✅ Gmail SMTP connection successful");
    return {
      success: true,
      message: "Gmail SMTP connection successful",
    };
  } catch (error) {
    console.error(`❌ Gmail SMTP connection failed: ${error.message}`);
    return {
      success: false,
      message: `Gmail SMTP connection failed: ${error.message}`,
    };
  }
};

/**
 * APPROVED EMAIL TEMPLATE
 * Format:
 * Hi [Candidate Name],
 *
 * Congratulations! You have been selected for the [Job Title] position at [Company Name].
 *
 * Our HR team will contact you soon with the next steps.
 *
 * Regards,
 * RecruitSmart
 */
export const sendApplicationAcceptedEmail = async ({
  to,
  candidateName = "Candidate",
  jobTitle = "Job Position",
  companyName = "Our Company",
}) => {
  try {
    const candidateEmail = Array.isArray(to) ? to[0] : (typeof to === "string" ? to.trim() : "");
    if (!candidateEmail || !candidateEmail.includes("@")) {
      console.error("❌ Candidate email not found or invalid");
      return { success: false, reason: "Candidate email not found or invalid" };
    }

    const pass = process.env.EMAIL_APP_PASSWORD;
    if (!pass || pass === "ADD_MY_GOOGLE_APP_PASSWORD_HERE") {
      console.error("❌ EMAIL FAILED: EMAIL_APP_PASSWORD is not configured in .env");
      return { success: false, reason: "SMTP credentials placeholder active" };
    }

    const cName = candidateName || "Candidate";
    const jTitle = jobTitle || "Job Position";
    const cComp = companyName || "Our Company";

    const fromAddress = `"RecruitSmart" <${process.env.EMAIL_USER || "foramsoni1312@gmail.com"}>`;
    const subjectText = "Application Status – Approved";
    const textBody = `Hi ${cName},\n\nCongratulations! You have been selected for the ${jTitle} position at ${cComp}.\n\nOur HR team will contact you soon with the next steps.\n\nRegards,\nRecruitSmart`;

    console.log("\n📧 RECRUITSMART EMAIL EVENT (APPROVED)");
    console.log(`From: ${fromAddress}`);
    console.log(`To: ${candidateEmail}`);
    console.log(`Subject: ${subjectText}`);
    console.log(`Text:\n${textBody}`);

    const info = await transporter.sendMail({
      from: fromAddress,
      to: candidateEmail,
      subject: subjectText,
      text: textBody,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log(`✅ Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ EMAIL FAILED:", error.message);
    throw error;
  }
};

export const sendAcceptedEmail = sendApplicationAcceptedEmail;

/**
 * REJECTED EMAIL TEMPLATE
 * Format:
 * Hi [Candidate Name],
 *
 * We regret to inform you that you were not selected for the [Job Title] position at [Company Name].
 *
 * We appreciate the time and effort you put into your application and wish you the best in your future.
 *
 * Regards,
 * RecruitSmart
 */
export const sendApplicationRejectedEmail = async ({
  to,
  candidateName = "Candidate",
  jobTitle = "Job Position",
  companyName = "Our Company",
}) => {
  try {
    const candidateEmail = Array.isArray(to) ? to[0] : (typeof to === "string" ? to.trim() : "");
    if (!candidateEmail || !candidateEmail.includes("@")) {
      console.error("❌ Candidate email not found or invalid");
      return { success: false, reason: "Candidate email not found or invalid" };
    }

    const pass = process.env.EMAIL_APP_PASSWORD;
    if (!pass || pass === "ADD_MY_GOOGLE_APP_PASSWORD_HERE") {
      console.error("❌ EMAIL FAILED: EMAIL_APP_PASSWORD is not configured in .env");
      return { success: false, reason: "SMTP credentials placeholder active" };
    }

    const cName = candidateName || "Candidate";
    const jTitle = jobTitle || "Job Position";
    const cComp = companyName || "Our Company";

    const fromAddress = `"RecruitSmart" <${process.env.EMAIL_USER || "foramsoni1312@gmail.com"}>`;
    const subjectText = `Application Status – ${jTitle}`;
    const textBody = `Hi ${cName},\n\nWe regret to inform you that you were not selected for the ${jTitle} position at ${cComp}.\n\nWe appreciate the time and effort you put into your application and wish you the best in your future.\n\nRegards,\nRecruitSmart`;

    console.log("\n📧 RECRUITSMART EMAIL EVENT (REJECTED)");
    console.log(`From: ${fromAddress}`);
    console.log(`To: ${candidateEmail}`);
    console.log(`Subject: ${subjectText}`);
    console.log(`Text:\n${textBody}`);

    const info = await transporter.sendMail({
      from: fromAddress,
      to: candidateEmail,
      subject: subjectText,
      text: textBody,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log(`✅ Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ EMAIL FAILED:", error.message);
    throw error;
  }
};

export const sendRejectedEmail = sendApplicationRejectedEmail;

/**
 * INTERVIEW SCHEDULED EMAIL
 */
export const sendInterviewScheduledEmail = async ({ to, candidateName = "Candidate", jobTitle = "Job Position", companyName = "Our Company", interviewDate, interviewTime, meetingLink = "" }) => {
  try {
    const candidateEmail = Array.isArray(to) ? to[0] : (typeof to === "string" ? to.trim() : "");
    if (!candidateEmail || !candidateEmail.includes("@")) return { success: false };

    const fromAddress = `"RecruitSmart" <${process.env.EMAIL_USER || "foramsoni1312@gmail.com"}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: candidateEmail,
      subject: `Interview Scheduled – ${jobTitle}`,
      text: `Hi **${candidateName}**,\n\nYour interview has been scheduled for the **${jobTitle}** position at **${companyName}**.\n\n**Interview Details**\nDate: **${interviewDate}**\nTime: **${interviewTime}**\nMeeting: **${meetingLink || "N/A"}**\n\nPlease make sure you are available at the scheduled time.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ EMAIL FAILED:", err.message);
    throw err;
  }
};

/**
 * INTERVIEW RESCHEDULED EMAIL
 */
export const sendInterviewRescheduledEmail = async ({ to, candidateName = "Candidate", jobTitle = "Job Position", companyName = "Our Company", newDate, newTime, meetingLink = "" }) => {
  try {
    const candidateEmail = Array.isArray(to) ? to[0] : (typeof to === "string" ? to.trim() : "");
    if (!candidateEmail || !candidateEmail.includes("@")) return { success: false };

    const fromAddress = `"RecruitSmart" <${process.env.EMAIL_USER || "foramsoni1312@gmail.com"}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: candidateEmail,
      subject: `Interview Rescheduled – ${jobTitle}`,
      text: `Hi **${candidateName}**,\n\nYour interview for the **${jobTitle}** position at **${companyName}** has been rescheduled successfully.\n\n**Updated Interview Details**\nDate: **${newDate}**\nTime: **${newTime}**\nMeeting: **${meetingLink || "N/A"}**\n\nPlease note the updated date and time.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ EMAIL FAILED:", err.message);
    throw err;
  }
};

/**
 * INTERVIEW CANCELLED EMAIL
 */
export const sendInterviewCancelledEmail = async ({ to, jobTitle = "Job Position" }) => {
  try {
    const candidateEmail = Array.isArray(to) ? to[0] : (typeof to === "string" ? to.trim() : "");
    if (!candidateEmail || !candidateEmail.includes("@")) return { success: false };

    const fromAddress = `"RecruitSmart" <${process.env.EMAIL_USER || "foramsoni1312@gmail.com"}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: candidateEmail,
      subject: `Interview Cancelled – ${jobTitle}`,
      text: `Your scheduled interview for ${jobTitle} has been cancelled.\n\nRegards,\nRecruitSmart`,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ EMAIL FAILED:", err.message);
    throw err;
  }
};

/**
 * INTERVIEW RESCHEDULE REJECTED EMAIL
 */
export const sendInterviewRescheduleRejectedEmail = async ({ to, candidateName = "Candidate", jobTitle = "Job Position", companyName = "Our Company", originalDate, originalTime }) => {
  try {
    const candidateEmail = Array.isArray(to) ? to[0] : (typeof to === "string" ? to.trim() : "");
    if (!candidateEmail || !candidateEmail.includes("@")) return { success: false };

    const fromAddress = `"RecruitSmart" <${process.env.EMAIL_USER || "foramsoni1312@gmail.com"}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: candidateEmail,
      subject: `Reschedule Request Rejected – ${jobTitle}`,
      text: `Hi **${candidateName}**,\n\nYour request to reschedule the interview for the **${jobTitle}** position at **${companyName}** was not approved.\n\nYour original interview remains scheduled:\n\n**Date:** ${originalDate}\n**Time:** ${originalTime}\n\nPlease attend the interview at the original scheduled time.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ EMAIL FAILED:", err.message);
    throw err;
  }
};

/**
 * Sends a test email to process.env.TEST_EMAIL
 */
export const sendTestEmail = async () => {
  const toEmail = process.env.TEST_EMAIL || "foram.imca22@gmail.com";
  return await sendApplicationAcceptedEmail({
    to: toEmail,
    candidateName: "Foram Soni",
    jobTitle: "Flask Developer",
    companyName: "ABC",
  });
};

/**
 * Generic email sender function for custom email sending requests.
 */
export const sendEmail = async ({
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
} = {}) => {
  try {
    const recipientTo = Array.isArray(to) ? to.join(", ") : to;
    const recipientCc = Array.isArray(cc) ? cc.join(", ") : cc;
    const recipientBcc = Array.isArray(bcc) ? bcc.join(", ") : bcc;

    if (!recipientTo && !recipientCc && !recipientBcc) {
      console.error("❌ Send email failed: No recipient specified");
      return { success: false, reason: "No recipient specified" };
    }

    const fromName = hrName || companyName || "RecruitSmart";
    const senderEmail = hrEmail || process.env.EMAIL_USER || "foramsoni1312@gmail.com";
    const fromAddress = `"${fromName}" <${senderEmail}>`;

    const mailOptions = {
      from: fromAddress,
      subject: subject || "Notification from RecruitSmart",
    };

    if (recipientTo) mailOptions.to = recipientTo;
    if (recipientCc) mailOptions.cc = recipientCc;
    if (recipientBcc) mailOptions.bcc = recipientBcc;
    if (text) mailOptions.text = text;
    if (html) mailOptions.html = html;

    console.log("\n📧 RECRUITSMART EMAIL EVENT (GENERIC)");
    console.log(`From: ${fromAddress}`);
    console.log(`To: ${recipientTo || "N/A"}`);
    if (recipientCc) console.log(`Cc: ${recipientCc}`);
    if (recipientBcc) console.log(`Bcc: ${recipientBcc}`);
    console.log(`Subject: ${mailOptions.subject}`);

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log(`✅ Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      recipients: { to: recipientTo, cc: recipientCc, bcc: recipientBcc },
    };
  } catch (error) {
    console.error("❌ EMAIL FAILED:", error.message);
    throw error;
  }
};

