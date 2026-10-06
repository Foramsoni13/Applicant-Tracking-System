import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import { createNotificationHelper } from "../routes/notificationRoutes.js";

// Helper: Convert time string (16:00 or 4:00 PM) to 12-hour formatted string
export const formatTime12Hour = (timeStr) => {
  if (!timeStr) return "";
  const cleaned = timeStr.trim();

  // If already contains AM/PM
  if (/am|pm/i.test(cleaned)) {
    return cleaned;
  }

  // Expect HH:MM in 24-hour format
  const parts = cleaned.split(":");
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);

  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${ampm}`;
};

// Helper: Parse YYYY-MM-DD + HH:MM / 4:00 PM into Date object
export const parseInterviewStart = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;

  try {
    const cleanDate = dateStr.trim();
    const cleanTime = timeStr.trim();

    let hours = 0;
    let minutes = 0;

    if (/am|pm/i.test(cleanTime)) {
      const match = cleanTime.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
      }
    } else {
      const parts = cleanTime.split(":");
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
    }

    const [year, month, day] = cleanDate.split("-").map((n) => parseInt(n, 10));
    if (!year || !month || !day) return null;

    const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return startDate;
  } catch (err) {
    console.error("parseInterviewStart error:", err.message);
    return null;
  }
};

// Check and send automatic 1-hour and 10-minute reminders
export const checkAndSendInterviewReminders = async () => {
  try {
    const activeInterviews = await Interview.find({
      status: { $nin: ["cancelled", "Cancelled", "completed", "Completed", "reschedule_requested", "Reschedule Requested"] },
    })
      .populate("candidateId")
      .populate("applicationId");

    const now = new Date();

    for (const inv of activeInterviews) {
      const dateStr = inv.date || inv.interviewDetails?.interviewDate;
      const timeStr = inv.time || inv.interviewDetails?.interviewTime;

      if (!dateStr || !timeStr) continue;

      const interviewStart = parseInterviewStart(dateStr, timeStr);
      if (!interviewStart || isNaN(interviewStart.getTime())) continue;

      const diffMs = interviewStart.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      const formattedTime = formatTime12Hour(timeStr);

      const candidateIdStr = (inv.candidateId?._id || inv.candidateId)?.toString();
      let hrIdStr = inv.hrId?.toString();

      if (!hrIdStr && inv.applicationId) {
        hrIdStr = inv.applicationId.hrId?.toString();
      }

      const candidateName = inv.candidateName || inv.candidateId?.name || inv.applicationId?.candidateName || "Candidate";
      const meetingLink = inv.meetingLink || inv.interviewDetails?.meetingLink || "/candidate-dashboard";

      if (!inv.remindersSent) {
        inv.remindersSent = { oneHour: false, tenMin: false };
      }

      let updated = false;

      // 1. ONE-HOUR REMINDER (window: 10m < diffMins <= 60m)
      if (diffMins > 10 && diffMins <= 60 && !inv.remindersSent.oneHour) {
        console.log(`[AUTOMATIC REMINDER] Triggering 1-hour reminder for Interview ID: ${inv._id} (${candidateName} at ${formattedTime})`);

        if (candidateIdStr) {
          await createNotificationHelper({
            userId: candidateIdStr,
            type: "INTERVIEW_REMINDER_1H",
            title: "Interview Reminder",
            message: `Your interview starts in 1 hour at ${formattedTime}.`,
            link: meetingLink,
          });
        }

        if (hrIdStr) {
          await createNotificationHelper({
            userId: hrIdStr,
            type: "INTERVIEW_REMINDER_1H_HR",
            title: "Interview Reminder",
            message: `Interview with ${candidateName} starts in 1 hour at ${formattedTime}.`,
            link: meetingLink,
          });
        }

        inv.remindersSent.oneHour = true;
        updated = true;
      }

      // 2. TEN-MINUTE REMINDER (window: -15m <= diffMins <= 10m)
      if (diffMins >= -15 && diffMins <= 10 && !inv.remindersSent.tenMin) {
        console.log(`[AUTOMATIC REMINDER] Triggering 10-minute reminder for Interview ID: ${inv._id} (${candidateName} at ${formattedTime})`);

        if (candidateIdStr) {
          await createNotificationHelper({
            userId: candidateIdStr,
            type: "INTERVIEW_REMINDER_10M",
            title: "Interview Starting Soon",
            message: `Your interview starts in 10 minutes at ${formattedTime}.`,
            link: meetingLink,
          });
        }

        if (hrIdStr) {
          await createNotificationHelper({
            userId: hrIdStr,
            type: "INTERVIEW_REMINDER_10M_HR",
            title: "Interview Starting Soon",
            message: `Your interview with ${candidateName} starts in 10 minutes at ${formattedTime}.`,
            link: meetingLink,
          });
        }

        inv.remindersSent.tenMin = true;
        updated = true;
      }

      if (updated) {
        await inv.save();
      }
    }
  } catch (err) {
    console.error("[REMINDER SERVICE ERROR]:", err.message);
  }
};

let intervalId = null;

export const initInterviewReminderService = () => {
  if (intervalId) return;
  console.log("⏰ Starting Automatic Background Interview Reminder Service (Interval: 30s)...");
  // Run once immediately
  checkAndSendInterviewReminders();
  // Schedule recurring every 30 seconds
  intervalId = setInterval(checkAndSendInterviewReminders, 30000);
};
