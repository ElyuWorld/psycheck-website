import nodemailer from "nodemailer";

export type AppointmentEmailDetails = {
  studentName: string;
  studentEmail: string;
  appointmentType: string;
  date: string;
  time: string;
  mode: string;
  meetingLink?: string;
};

export type ApprovedAppointmentEmail = AppointmentEmailDetails;

export type ReferralNoticeEmail = {
  referredName: string;
  referredEmail: string;
  referrerName: string;
};

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function getFromAddress() {
  return (
    process.env.EMAIL_FROM ||
    `"PsyCheck No-Reply" <${process.env.SMTP_USER}>`
  );
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapEmail(title: string, bodyHtml: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f4fbf7;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #d1fae5;">
        <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#087f3e;font-weight:700;">
          PsyCheck
        </p>
        <h1 style="margin:12px 0 16px;font-size:24px;color:#064e3b;">
          ${title}
        </h1>
        ${bodyHtml}
        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">
          This is an automated no-reply message from PsyCheck. Please do not
          reply to this email. If you have questions, contact your counselor
          through your school support office.
        </p>
      </div>
    </div>
  `;
}

function appointmentDetailsHtml(appointment: AppointmentEmailDetails) {
  return `
    <div style="margin:24px 0;padding:16px 18px;background:#f0fdf4;border-radius:12px;">
      <p style="margin:0;font-size:14px;color:#065f46;"><strong>Type:</strong> ${escapeHtml(appointment.appointmentType)}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#065f46;"><strong>Date:</strong> ${escapeHtml(appointment.date)}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#065f46;"><strong>Time:</strong> ${escapeHtml(appointment.time)}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#065f46;"><strong>Mode:</strong> ${escapeHtml(appointment.mode)}</p>
    </div>
  `;
}

async function sendNoReplyEmail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env.local"
    );
  }

  const transporter = createTransport();

  await transporter.sendMail({
    from: getFromAddress(),
    to: options.to,
    replyTo: process.env.EMAIL_REPLY_TO || process.env.SMTP_USER,
    subject: options.subject,
    text: options.text,
    html: options.html,
    headers: {
      "X-Auto-Response-Suppress": "All",
    },
  });
}

export async function sendAppointmentApprovedEmail(
  appointment: ApprovedAppointmentEmail
) {
  const safeName = escapeHtml(appointment.studentName);
  const meetingBlock = appointment.meetingLink
    ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#374151;">
        Join your online session here:<br />
        <a href="${escapeHtml(appointment.meetingLink)}" style="color:#087f3e;">${escapeHtml(appointment.meetingLink)}</a>
      </p>`
    : "";

  await sendNoReplyEmail({
    to: appointment.studentEmail,
    subject: "PsyCheck appointment approved",
    html: wrapEmail(
      "Your appointment is approved",
      `
        <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">
          Hello ${safeName},
        </p>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#374151;">
          Your psychosocial support appointment request has been approved.
          Please see the details below.
        </p>
        ${appointmentDetailsHtml(appointment)}
        ${meetingBlock}
      `
    ),
    text: [
      `Hello ${appointment.studentName},`,
      "",
      "Your PsyCheck appointment request has been approved.",
      `Type: ${appointment.appointmentType}`,
      `Date: ${appointment.date}`,
      `Time: ${appointment.time}`,
      `Mode: ${appointment.mode}`,
      appointment.meetingLink ? `Meeting link: ${appointment.meetingLink}` : "",
      "",
      "This is an automated no-reply message. Please do not reply to this email.",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendAppointmentRequestedEmail(
  appointment: AppointmentEmailDetails
) {
  const safeName = escapeHtml(appointment.studentName);

  await sendNoReplyEmail({
    to: appointment.studentEmail,
    subject: "PsyCheck appointment request received",
    html: wrapEmail(
      "We received your appointment request",
      `
        <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">
          Hello ${safeName},
        </p>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#374151;">
          Your psychosocial support appointment request has been submitted.
          A counselor will review it. Please see the details below.
        </p>
        ${appointmentDetailsHtml(appointment)}
        <p style="margin:0;font-size:14px;line-height:1.7;color:#065f46;">
          <strong>Status:</strong> Pending
        </p>
      `
    ),
    text: [
      `Hello ${appointment.studentName},`,
      "",
      "Your PsyCheck appointment request has been submitted. A counselor will review it.",
      `Type: ${appointment.appointmentType}`,
      `Date: ${appointment.date}`,
      `Time: ${appointment.time}`,
      `Mode: ${appointment.mode}`,
      "Status: Pending",
      "",
      "This is an automated no-reply message. Please do not reply to this email.",
    ].join("\n"),
  });
}

export async function sendReferralNotificationEmail(
  referral: ReferralNoticeEmail
) {
  const safeReferredName = escapeHtml(referral.referredName);
  const safeReferrerName = escapeHtml(referral.referrerName);

  await sendNoReplyEmail({
    to: referral.referredEmail,
    subject: "You were referred to PsyCheck",
    html: wrapEmail(
      "You were referred to PsyCheck",
      `
        <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">
          Hello ${safeReferredName},
        </p>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#374151;">
          ${safeReferrerName} referred you for psychosocial support through PsyCheck.
          A counselor will review this referral. You do not need to reply to this email.
        </p>
      `
    ),
    text: [
      `Hello ${referral.referredName},`,
      "",
      `${referral.referrerName} referred you for psychosocial support through PsyCheck.`,
      "A counselor will review this referral. You do not need to reply to this email.",
      "",
      "This is an automated no-reply message. Please do not reply to this email.",
    ].join("\n"),
  });
}
