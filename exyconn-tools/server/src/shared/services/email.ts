import nodemailer, { Transporter } from "nodemailer";
import { getActiveEmailConfig } from "./integration-config";
import { clientErrorMessage } from "../errors";

let cached: { key: string; transporter: Transporter } | null = null;

/**
 * Builds a transport from the SMTP account the portal marks active (managed at
 * Admin > Environment Variables, stored in MongoDB — no SMTP env vars here).
 * The transport is rebuilt whenever those credentials change.
 */
async function getTransporter(): Promise<{
  transporter: Transporter;
  from: string;
}> {
  const config = await getActiveEmailConfig();
  const key = `${config.host}:${config.port}:${config.username}:${config.password}`;
  if (cached?.key !== key) {
    cached = {
      key,
      transporter: nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.username, pass: config.password },
      }),
    };
  }
  return { transporter: cached.transporter, from: config.fromAddress };
}

/** "Exyconn <a@b.com>" -> "a@b.com"; a bare address passes through unchanged. */
function addressOf(from: string): string {
  let open = from.indexOf("<");
  while (open >= 0) {
    const close = from.indexOf(">", open + 1);
    if (close < 0) {
      break;
    }
    if (close > open + 1) {
      return from.slice(open + 1, close);
    }
    open = from.indexOf("<", open + 1);
  }
  return from;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    const { transporter, from } = await getTransporter();
    const info = await transporter.sendMail({
      from: options.from || `"Creative Tools" <${addressOf(from)}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: clientErrorMessage(error, "Failed to send email"),
    };
  }
}
