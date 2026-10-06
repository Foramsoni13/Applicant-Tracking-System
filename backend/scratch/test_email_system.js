import "dotenv/config";
import {
  verifySmtpConnection,
  sendTestEmail,
  sendAcceptedEmail,
  sendRejectedEmail,
  sendInterviewScheduledEmail,
  sendInterviewRescheduledEmail,
  sendInterviewCancelledEmail
} from "../services/emailService.js";

async function runTests() {
  console.log("=== 1. VERIFY SMTP CONNECTION ===");
  const smtpResult = await verifySmtpConnection();
  console.log("SMTP Verification Result:", smtpResult);

  console.log("\n=== 2. TEST EMAIL (to process.env.TEST_EMAIL) ===");
  const testResult = await sendTestEmail();
  console.log("Test Email Result:", testResult);

  console.log("\n=== 3. ACCEPTED EMAIL (Dry Run) ===");
  const acceptResult = await sendAcceptedEmail({
    to: "testcandidate@example.com",
    candidateName: "John Doe",
    jobTitle: "Software Engineer",
    companyName: "TechCorp",
    matchScore: 88,
  });
  console.log("Accepted Email Result:", acceptResult);

  console.log("\n=== 4. REJECTED EMAIL (Dry Run) ===");
  const rejectResult = await sendRejectedEmail({
    to: "testcandidate@example.com",
    candidateName: "John Doe",
    jobTitle: "Software Engineer",
    companyName: "TechCorp",
    rejectionReason: "Skills fit required more experience in Python.",
  });
  console.log("Rejected Email Result:", rejectResult);

  console.log("\n=== 5. INTERVIEW SCHEDULED EMAIL (Dry Run) ===");
  const scheduleResult = await sendInterviewScheduledEmail({
    to: "testcandidate@example.com",
    candidateName: "John Doe",
    jobTitle: "Software Engineer",
    companyName: "TechCorp",
    interviewDate: "2026-09-05",
    interviewTime: "10:00 AM",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    type: "Online",
  });
  console.log("Interview Scheduled Result:", scheduleResult);

  console.log("\n=== 6. INTERVIEW RESCHEDULED EMAIL (Dry Run) ===");
  const rescheduleResult = await sendInterviewRescheduledEmail({
    to: "testcandidate@example.com",
    candidateName: "John Doe",
    jobTitle: "Software Engineer",
    companyName: "TechCorp",
    previousDate: "2026-09-05",
    previousTime: "10:00 AM",
    newDate: "2026-09-06",
    newTime: "02:00 PM",
    meetingLink: "https://meet.google.com/abc-defg-hij",
  });
  console.log("Interview Rescheduled Result:", rescheduleResult);

  console.log("\n=== 7. INTERVIEW CANCELLED EMAIL (Dry Run) ===");
  const cancelResult = await sendInterviewCancelledEmail({
    to: "testcandidate@example.com",
    candidateName: "John Doe",
    jobTitle: "Software Engineer",
    companyName: "TechCorp",
  });
  console.log("Interview Cancelled Result:", cancelResult);

  console.log("\n✅ All Email Functions Tested Safely Without Crashing!");
  process.exit(0);
}

runTests();
