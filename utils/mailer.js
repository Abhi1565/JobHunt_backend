import nodemailer from "nodemailer";

export const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP settings are missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendOtpEmail = async ({ to, otp }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "JobHunt";

  return transporter.sendMail({
    from: `${appName} <${from}>`,
    to,
    subject: `${appName} Password Reset OTP`,
    text: `Your OTP is ${otp}. It is valid for 10 minutes. If you did not request this, ignore this email.`,
    html: `
      <p>Your OTP is <strong>${otp}</strong>.</p>
      <p>It is valid for <strong>10 minutes</strong>.</p>
      <p>If you did not request this, ignore this email.</p>
    `,
  });
};

export const sendInterviewEmail = async ({ to, applicantName, jobTitle, companyName, interview }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "JobHunt";

  const modeLabel = interview?.mode === "onsite" ? "Onsite" : "Online";
  const when = interview?.date ? new Date(interview.date).toLocaleDateString() : "TBD";
  const time = interview?.time || "TBD";
  const location = interview?.location || "";
  const meetingLink = interview?.meetingLink || "";

  const locationLine = interview?.mode === "onsite" ? location : meetingLink;
  const locationLabel = interview?.mode === "onsite" ? "Location" : "Meeting link";

  return transporter.sendMail({
    from: `${appName} <${from}>`,
    to,
    subject: `${appName} Interview Scheduled - ${jobTitle}`,
    text: `Hi ${applicantName},

Your interview has been scheduled for ${jobTitle} at ${companyName}.
Date: ${when}
Time: ${time}
Mode: ${modeLabel}
${locationLabel}: ${locationLine}

If you have any questions, reply to this email.`,
    html: `
      <p>Hi ${applicantName},</p>
      <p>Your interview has been scheduled for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <ul>
        <li><strong>Date:</strong> ${when}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>Mode:</strong> ${modeLabel}</li>
        <li><strong>${locationLabel}:</strong> ${locationLine}</li>
      </ul>
      <p>If you have any questions, reply to this email.</p>
    `,
  });
};

export const sendInterviewRescheduledEmail = async ({ to, applicantName, jobTitle, companyName, interview }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "JobHunt";

  const modeLabel = interview?.mode === "onsite" ? "Onsite" : "Online";
  const when = interview?.date ? new Date(interview.date).toLocaleDateString() : "TBD";
  const time = interview?.time || "TBD";
  const location = interview?.location || "";
  const meetingLink = interview?.meetingLink || "";

  const locationLine = interview?.mode === "onsite" ? location : meetingLink;
  const locationLabel = interview?.mode === "onsite" ? "Location" : "Meeting link";

  return transporter.sendMail({
    from: `${appName} <${from}>`,
    to,
    subject: `${appName} Interview Rescheduled - ${jobTitle}`,
    text: `Hi ${applicantName},

Your interview for ${jobTitle} at ${companyName} has been rescheduled.
Date: ${when}
Time: ${time}
Mode: ${modeLabel}
${locationLabel}: ${locationLine}

If you have any questions, reply to this email.`,
    html: `
      <p>Hi ${applicantName},</p>
      <p>Your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been rescheduled.</p>
      <ul>
        <li><strong>Date:</strong> ${when}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>Mode:</strong> ${modeLabel}</li>
        <li><strong>${locationLabel}:</strong> ${locationLine}</li>
      </ul>
      <p>If you have any questions, reply to this email.</p>
    `,
  });
};

export const sendRejectionEmail = async ({ to, applicantName, jobTitle, companyName }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "JobHunt";

  return transporter.sendMail({
    from: `${appName} <${from}>`,
    to,
    subject: `${appName} Application Update - ${jobTitle}`,
    text: `Hi ${applicantName},

Thank you for applying to ${jobTitle} at ${companyName}. After careful consideration, we will not be moving forward at this time.

We appreciate your interest and wish you the best in your job search.`,
    html: `
      <p>Hi ${applicantName},</p>
      <p>Thank you for applying to <strong>${jobTitle}</strong> at <strong>${companyName}</strong>. After careful consideration, we will not be moving forward at this time.</p>
      <p>We appreciate your interest and wish you the best in your job search.</p>
    `,
  });
};

export const sendHiredEmail = async ({ to, applicantName, jobTitle, companyName, salary }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "JobHunt";
  const salaryLine = Number.isFinite(salary) ? `${salary} LPA` : "the discussed package";

  return transporter.sendMail({
    from: `${appName} <${from}>`,
    to,
    subject: `${appName} Offer - ${jobTitle}`,
    text: `Hi ${applicantName},

Congratulations! You have been selected for the role of ${jobTitle} at ${companyName}.
Package: ${salaryLine}

We will follow up with next steps soon.`,
    html: `
      <p>Hi ${applicantName},</p>
      <p><strong>Congratulations!</strong> You have been selected for the role of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p><strong>Package:</strong> ${salaryLine}</p>
      <p>We will follow up with next steps soon.</p>
    `,
  });
};
