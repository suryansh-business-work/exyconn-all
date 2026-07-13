import nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import { env } from '../config/env';
import { logger } from './logger';
import { welcomeTemplate } from '../templates/welcome.template';
import { credentialsTemplate } from '../templates/credentials.template';
import { customTemplate } from '../templates/custom.template';
import { trackerAccessTemplate } from '../templates/tracker-access.template';
import { EmailConfigModel, type EmailConfigDocument } from '../modules/tech/email-config.model';
import type { Role } from '../constants/roles';

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

export interface CustomEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface TrackerAccessEmailPayload {
  name: string;
  email: string;
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
      throw new Error('No active email configuration. Add one in the Tech module.');
    }
    return this.buildTransport(config);
  }

  /** Compiles MJML and delivers a single message through the active transport. */
  private async send(to: string, subject: string, mjml: string): Promise<void> {
    const { transporter, fromAddress } = await this.getTransport();
    const { html, errors } = await mjml2html(mjml);
    if (errors.length) {
      logger.error({ errors }, `MJML compilation produced errors for "${subject}"`);
    }
    await transporter.sendMail({ from: fromAddress, to, subject, html });
    logger.info(`Email "${subject}" sent to ${to}`);
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
    await this.send(payload.email, payload.subject, mjml);
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
    logger.info(`Test email sent to ${to} via config "${config.label}"`);
  }
}

export const mailer = new Mailer();
