import mjml2html from 'mjml';
import nodemailer from 'nodemailer';
import { EmailFragmentModel } from './email-fragment.model';
import { EmailTemplateModel } from './email-template.model';
import { EmailLogModel } from './email-log.model';
import { EmailConfigModel, type EmailConfigDocument } from '../tech/email-config.model';
import { BrandingModel } from '../branding/branding.model';
import { EmailRenderError, renderTemplate, variablesIn, fragmentsIn } from './email.render';
import { logger } from '../../utils/logger';

/** Everything a caller needs to send one templated message. */
export interface SendTemplateInput {
  /** The template's `key`, e.g. `policy-published`. */
  template: string;
  to: string;
  /** Values for every `{{placeholder}}` the template uses. */
  variables: Record<string, string>;
  replyTo?: string;
  /** Who asked for this, for the log. An email address, or a description of the process. */
  triggeredBy?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  /** Placeholders the template asks for — what a test form should offer. */
  variables: string[];
  fragments: string[];
}

/**
 * Values every template may use without any caller supplying them.
 *
 * The shared header and footer are branded, so they need the company's name — and making
 * every caller pass it would mean every caller knowing what the shell happens to contain
 * this month. Change the shell and every send site breaks. These come from Branding
 * instead, and a caller can still override one by passing it explicitly.
 */
async function brandVariables(): Promise<Record<string, string>> {
  const branding = await BrandingModel.findOne().lean();
  return {
    companyName: branding?.businessName ?? 'Exyconn',
    supportEmail: branding?.supportEmail ?? '',
    websiteUrl: branding?.websiteUrl ?? '',
  };
}

/** Every fragment, keyed for the renderer. Templates are short; this is one small read. */
async function loadFragments(): Promise<Map<string, string>> {
  const rows = await EmailFragmentModel.find().select('key mjml').lean();
  return new Map(rows.map((row) => [row.key, row.mjml]));
}

function buildTransport(config: EmailConfigDocument) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.username, pass: config.password },
  });
}

/**
 * Renders a stored template to HTML.
 *
 * Used by the send path and by the portal's preview, so what an author sees while editing is
 * produced by exactly the code that will send it — a preview rendered by a second, simpler
 * path is a preview that lies.
 */
export async function renderStoredTemplate(
  key: string,
  variables: Record<string, string>,
): Promise<RenderedEmail> {
  const template = await EmailTemplateModel.findOne({ key }).lean();
  if (!template) {
    throw new EmailRenderError(`No email template with the key "${key}".`);
  }

  const [fragments, brand] = await Promise.all([loadFragments(), brandVariables()]);
  const rendered = renderTemplate({
    subject: template.subject,
    mjml: template.mjml,
    fragments,
    // The caller wins: an explicit value overrides the branded default.
    variables: { ...brand, ...variables },
  });

  const { html, errors } = await mjml2html(rendered.mjml);
  if (errors.length > 0) {
    logger.error({ errors }, `MJML errors while rendering "${key}"`);
  }

  return {
    subject: rendered.subject,
    html,
    variables: variablesIn(`${template.subject} ${template.mjml}`),
    fragments: fragmentsIn(template.mjml),
  };
}

/**
 * What a template asks for BEFORE anything is filled in — including whatever its fragments
 * ask for. The portal's test form is built from this, so it can never offer the wrong fields.
 */
export async function describeTemplate(key: string): Promise<RenderedEmail['variables']> {
  const template = await EmailTemplateModel.findOne({ key }).lean();
  if (!template) {
    throw new EmailRenderError(`No email template with the key "${key}".`);
  }
  const [fragments, brand] = await Promise.all([loadFragments(), brandVariables()]);
  const expandedBody = fragmentsIn(template.mjml)
    .map((name) => fragments.get(name) ?? '')
    .join(' ');
  // Branded values are filled in automatically, so a test form must not ask for them.
  return variablesIn(`${template.subject} ${template.mjml} ${expandedBody}`).filter(
    (name) => !(name in brand),
  );
}

/**
 * Sends one templated email, and records the attempt either way.
 *
 * The log entry is the point of this function existing rather than callers reaching for
 * nodemailer: "the customer says they never got it" is unanswerable without a record of
 * what was sent, to whom, and what the transport said when it refused.
 *
 * A failure is logged and then rethrown. Swallowing it would let a caller believe an
 * employee had been told something they never were.
 */
export async function sendTemplateEmail(input: SendTemplateInput): Promise<void> {
  const template = await EmailTemplateModel.findOne({ key: input.template }).lean();
  if (!template) {
    throw new EmailRenderError(`No email template with the key "${input.template}".`);
  }
  if (!template.isActive) {
    throw new EmailRenderError(
      `The "${template.name}" template is switched off, so nothing was sent.`,
    );
  }

  const config = await EmailConfigModel.findOne({ isActive: true }).lean();
  if (!config) {
    throw new EmailRenderError('No active email configuration. Add one in Tech → Email.');
  }

  const rendered = await renderStoredTemplate(input.template, input.variables);

  const entry = {
    templateKey: template.key,
    templateName: template.name,
    to: input.to,
    subject: rendered.subject,
    variables: input.variables,
    triggeredBy: input.triggeredBy ?? '',
    sentAt: new Date(),
  };

  try {
    await buildTransport(config).sendMail({
      from: config.fromAddress,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      replyTo: input.replyTo,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'The transport refused the message.';
    await EmailLogModel.create({ ...entry, status: 'FAILED', error: reason });
    logger.error({ err: error }, `Email "${template.key}" to ${input.to} failed`);
    throw error;
  }

  await EmailLogModel.create({ ...entry, status: 'SENT' });
  logger.info(`Email "${template.key}" sent to ${input.to}`);
}

/**
 * The one way to send a templated email from anywhere in the server.
 *
 * Deliberately a tiny surface: callers name a template and hand over values, and know
 * nothing about MJML, SMTP or the log. Changing what an email says is then an edit in the
 * portal rather than a deploy.
 */
export const emailer = {
  send: sendTemplateEmail,
  render: renderStoredTemplate,
  describe: describeTemplate,
};
