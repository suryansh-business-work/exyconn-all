import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

// Use bracket notation so Vite does NOT replace these at build time
function env(key: string): string {
  return process.env[key] || "";
}

function getTransporter() {
  if (!transporter) {
    const host = env("SMTP_HOST") || "smtp.gmail.com";
    const port = Number(env("SMTP_PORT") || 587);
    const user = env("SMTP_USER");
    const pass = env("SMTP_PASS");

    if (!user || !pass) {
      throw new Error(
        `SMTP credentials missing — SMTP_USER: ${user ? "set" : "MISSING"}, SMTP_PASS: ${pass ? "set" : "MISSING"}`
      );
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: { user, pass },
    });
  }
  return transporter;
}

interface SendMailOptions {
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMail({ subject, html, replyTo }: SendMailOptions) {
  const from = env("SMTP_FROM") || "Exyconn <suryansh@exyconn.com>";
  const to = env("SMTP_TO") || "suryansh@exyconn.com";
  return getTransporter().sendMail({
    from,
    to,
    replyTo,
    subject,
    html,
  });
}

// ─── MJML-style HTML email builder ───────────────────────────────────────────
// We generate MJML-compatible HTML directly (table-based responsive layout)
// so we don't need the heavy mjml compiler at runtime.

function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#6b7280;font-size:13px;font-weight:600;width:140px;vertical-align:top;">${esc(label)}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#1f2937;font-size:14px;">${esc(value)}</td>
    </tr>`;
}

function buildEmail(
  title: string,
  subtitle: string,
  badge: string,
  badgeColor: string,
  fields: [string, string][]
) {
  const rows = fields.map(([l, v]) => row(l, v)).join("");

  return `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr><td align="center" style="padding:40px 16px;">

      <!-- Container -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e1b4b 0%,#4338ca 100%);padding:32px 40px;text-align:center;">
            <img src="https://ik.imagekit.io/esdata1/exyconn/logo/exyconn.png" alt="Exyconn" width="140" style="display:inline-block;margin-bottom:12px;" />
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">Enterprise Technology Solutions</p>
          </td>
        </tr>

        <!-- Badge + Title -->
        <tr>
          <td style="padding:32px 40px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:${badgeColor};color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;text-transform:uppercase;letter-spacing:0.05em;">${esc(badge)}</td>
              </tr>
            </table>
            <h1 style="color:#1f2937;font-size:22px;font-weight:700;margin:16px 0 4px;">${esc(title)}</h1>
            <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">${esc(subtitle)}</p>
          </td>
        </tr>

        <!-- Fields -->
        <tr>
          <td style="padding:0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              ${rows}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px;text-align:center;border-top:1px solid #f0f0f0;margin-top:24px;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">This is an automated notification from <a href="https://exyconn.com" style="color:#4338ca;text-decoration:none;">exyconn.com</a></p>
            <p style="color:#d1d5db;font-size:11px;margin:8px 0 0;">&copy; ${new Date().getFullYear()} Exyconn. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Per-form email builders ─────────────────────────────────────────────────

export function contactEmail(d: Record<string, string>) {
  return buildEmail(
    "New Contact Form Submission",
    `${d.firstName} ${d.lastName} reached out via the contact form.`,
    "Contact",
    "#4338ca",
    [
      ["Name", `${d.firstName} ${d.lastName}`],
      ["Email", d.email],
      ["Company", d.company || "—"],
      ["Subject", d.subject],
      ["Message", d.message],
    ]
  );
}

export function grievanceEmail(d: Record<string, string>) {
  return buildEmail(
    "New Grievance Submission",
    `${d.name} submitted a grievance.`,
    "Grievance",
    "#dc2626",
    [
      ["Name", d.name],
      ["Email", d.email],
      ["Subject", d.subject],
      ["Message", d.message],
    ]
  );
}

export function legalEmail(d: Record<string, string>) {
  return buildEmail(
    "New Legal Request",
    `${d.name} submitted a legal request.`,
    "Legal",
    "#b45309",
    [
      ["Name", d.name],
      ["Email", d.email],
      ["Request Type", d.legalType],
      ["URL", d.url || "—"],
      ["Details", d.details],
    ]
  );
}

export function careerEmail(d: Record<string, string>) {
  return buildEmail(
    "New Job Application",
    `${d.name} applied for a position.`,
    "Career",
    "#059669",
    [
      ["Name", d.name],
      ["Email", d.email],
      ["Phone", d.phone || "—"],
      ["Job ID", d.jobId || "—"],
      ["Resume", d.resumeName || "—"],
      ["Message", d.message || "—"],
    ]
  );
}

export function indiaOfferEmail(d: Record<string, string>) {
  return buildEmail(
    "नई India Offer इन्क्वायरी",
    `${d.name} ने India Offer फ़ॉर्म भरा है।`,
    "India Offer",
    "#7c3aed",
    [
      ["नाम", d.name],
      ["फ़ोन", d.phone],
      ["ईमेल", d.email],
      ["बिज़नेस", d.business || "—"],
      ["प्लान", d.plan],
      ["संदेश", d.message || "—"],
    ]
  );
}

export function newsletterEmail(d: Record<string, string>) {
  return buildEmail(
    "New Newsletter Subscription",
    `${d.email} subscribed to the newsletter.`,
    "Newsletter",
    "#7c3aed",
    [["Email", d.email]]
  );
}

export function jobApplicationEmail(d: Record<string, string>) {
  return buildEmail(
    "New Job Application",
    `${d.firstName} ${d.lastName} applied for ${d.jobTitle} at ${d.companyName}.`,
    "Job Application",
    "#059669",
    [
      ["Name", `${d.firstName} ${d.lastName}`],
      ["Email", d.email],
      ["Phone", d.phone || "—"],
      ["Location", d.location || "—"],
      ["Job Title", d.jobTitle || "—"],
      ["Job ID", d.jobId || "—"],
      ["Company", d.companyName || "—"],
      ["Experience", d.experience || "—"],
      ["Notice Period", d.noticePeriod || "—"],
      ["Current CTC", d.currentCTC || "—"],
      ["Expected CTC", d.expectedCTC || "—"],
      ["LinkedIn", d.linkedin || "—"],
      ["Portfolio", d.portfolio || "—"],
      ["Resume", d.resumeName || "—"],
      ["Cover Letter", d.coverLetter || "—"],
      ["Referral Source", d.referral || "—"],
    ]
  );
}
