import nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import { env } from '../config/env';
import { logger } from './logger';
import { maskEmail } from './maskEmail';
import { welcomeTemplate } from '../templates/welcome.template';
import { credentialsTemplate } from '../templates/credentials.template';
import { customTemplate } from '../templates/custom.template';
import { trackerAccessTemplate } from '../templates/tracker-access.template';
import { formSubmissionTemplate } from '../templates/form-submission.template';
import { EmailConfigModel, type EmailConfigDocument } from '../modules/tech/email-config.model';
import type { Role } from '../constants/roles';
import { ConfigurationError } from './errors';

export interface WelcomeEmailPayload {
  name: string;
  email: string;
  password: string;
  roles: Role[];
}

export interface CredentialsEmailPayload {
  name: string;
  email: string;
  password: string;
}

/** A file attached by URL; the mail transport fetches it when it sends. */
export interface MailAttachment {
  filename: string;
  path: string;
  contentType?: string;
}

export interface CustomEmailPayload {
  name: string;
  email: string;
  subject: string;
  /** Plain text; blank lines start paragraphs. */
  message: string;
  /** A rich-text body (HTML) instead of `message`; sanitised by the template. */
  html?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: MailAttachment[];
}

/** Who else gets a copy, and what rides along. */
interface SendExtras {
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: MailAttachment[];
}

/** One personalised marketing copy, already rendered. */
export interface MarketingEmailPayload {
  to: string;
  fromName: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  /** RFC 2369 / RFC 8058 unsubscribe headers. */
  listUnsubscribeUrl: string;
}

export interface TrackerAccessEmailPayload {
  name: string;
  email: string;
}

export interface FormSubmissionEmailPayload {
  formType: string;
  submissionData: Record<string, unknown>;
  replyTo?: string;
}

/**
 * Transactional email sender (singleton). The SMTP credentials are loaded from
 * the active Email config in the Tech module (DB-backed, no env dependency).
 */
class Mailer {
  /** Builds a nodemailer transport from an explicit Email config document. */
  private buildTransport(config: EmailConfigDocument) {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.username, pass: config.password },
    });
    return { transporter, fromAddress: config.fromAddress };
  }

  /** Builds a transport from the single active Email config, or throws. */
  private async getTransport() {
    const config = await EmailConfigModel.findOne({ isActive: true }).lean();
    if (!config) {
      throw new ConfigurationError('No active email configuration. Add one in the Tech module.');
    }
    return this.buildTransport(config);
  }

  /** Compiles MJML and delivers a single message through the active transport. */
  private async send(
    to: string,
    subject: string,
    mjml: string,
    extras: SendExtras = {},
  ): Promise<void> {
    const { transporter, fromAddress } = await this.getTransport();
    const { html, errors } = await mjml2html(mjml);
    if (errors.length) {
      logger.error({ errors }, `MJML compilation produced errors for "${subject}"`);
    }
    await transporter.sendMail({ from: fromAddress, to, subject, html, ...extras });
    logger.info(`Email "${subject}" sent to ${maskEmail(to)}`);
  }

  async sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
    const mjml = welcomeTemplate({ ...payload, appUrl: env.appUrl });
    await this.send(payload.email, 'Welcome to Exyconn Portal — your account is ready', mjml);
  }

  async sendCredentialsEmail(payload: CredentialsEmailPayload): Promise<void> {
    const mjml = credentialsTemplate({ ...payload, appUrl: env.appUrl });
    await this.send(payload.email, 'Your Exyconn Portal password has been reset', mjml);
  }

  async sendCustomEmail(payload: CustomEmailPayload): Promise<void> {
    const mjml = customTemplate(payload);
    await this.send(payload.email, payload.subject, mjml, {
      cc: payload.cc,
      bcc: payload.bcc,
      attachments: payload.attachments,
    });
  }

  /**
   * Sends a marketing copy from the verified address under the campaign's sender name, with
   * one-click unsubscribe headers (RFC 8058) so mail clients can offer their own button.
   * The name goes in nodemailer's structured `from`, so it can never inject a header.
   */
  async sendMarketingEmail(payload: MarketingEmailPayload): Promise<void> {
    const { transporter, fromAddress } = await this.getTransport();
    await transporter.sendMail({
      from: { name: payload.fromName, address: fromAddress },
      to: payload.to,
      replyTo: payload.replyTo || undefined,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      headers: {
        'List-Unsubscribe': `<${payload.listUnsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    logger.info(`Marketing email "${payload.subject}" sent to ${maskEmail(payload.to)}`);
  }

  /** Notifies an employee that they may now use the desktop tracker. */
  async sendTrackerAccessEmail(payload: TrackerAccessEmailPayload): Promise<void> {
    const mjml = trackerAccessTemplate({
      name: payload.name,
      downloadUrl: env.trackerDownloadUrl,
    });
    await this.send(
      payload.email,
      'Exyconn Tracker — your access is ready, start tracking your work',
      mjml,
    );
  }

  /**
   * Notifies the team about a form submitted on the public website. The
   * notification goes to the active SMTP config's own from-address, so the
   * recipient is managed in Admin › Environment Variables rather than in env.
   */
  async sendFormSubmissionEmail(payload: FormSubmissionEmailPayload): Promise<void> {
    const { fromAddress } = await this.getTransport();
    const mjml = formSubmissionTemplate({
      formType: payload.formType,
      submissionData: payload.submissionData,
    });
    const subject = `Website form: ${payload.formType}`;
    await this.send(fromAddress, subject, mjml, { replyTo: payload.replyTo });
  }

  /**
   * Sends a verification email through an explicit config (not necessarily the
   * active one) so an admin can validate SMTP credentials before activating.
   */
  async sendTestEmail(config: EmailConfigDocument, to: string): Promise<void> {
    const subject = 'Exyconn Portal — SMTP test email';
    const message = `This is a test email sent from the "${config.label}" SMTP configuration in the Tech module.\n\nIf you received this, the credentials are working correctly.`;
    const mjml = customTemplate({ name: 'there', subject, message });
    const { transporter, fromAddress } = this.buildTransport(config);
    const { html, errors } = await mjml2html(mjml);
    if (errors.length) {
      logger.error({ errors }, 'MJML compilation produced errors for test email');
    }
    await transporter.sendMail({ from: fromAddress, to, subject, html });
    logger.info(`Test email sent to ${maskEmail(to)} via config "${config.label}"`);
  }
}

export const mailer = new Mailer();
