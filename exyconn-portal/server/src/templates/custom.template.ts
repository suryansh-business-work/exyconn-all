import { escapeHtml } from '../modules/email/email.render';
import { mjmlShell } from './layout.template';
import { sanitizeRichHtml } from '../utils/sanitizeHtml';

export interface CustomEmailData {
  name: string;
  subject: string;
  /** Plain text: blank lines start paragraphs. Used when there is no `html`. */
  message: string;
  /** A rich-text body (HTML), sanitised here; takes the place of `message` when given. */
  html?: string;
}

/** Escapes user-supplied text and converts newlines into MJML paragraphs. */
function paragraphs(message: string): string {
  return message
    .split(/\n{2,}/)
    .map((block) => {
      const safe = block
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('\n', '<br />');
      return `<mj-text font-size="15px" color="#334155" line-height="24px">${safe}</mj-text>`;
    })
    .join('');
}

/** A rich-text body, cleaned of anything that is not formatting, as one MJML block. */
function richBlock(html: string): string {
  return `<mj-text font-size="15px" color="#334155" line-height="24px">${sanitizeRichHtml(html)}</mj-text>`;
}

/**
 * Builds the MJML markup for an admin-composed custom email. The subject becomes
 * the heading and the message body is wrapped in the branded shell.
 */
export function customTemplate(data: CustomEmailData): string {
  const { name, subject, message, html } = data;
  // The name and subject are text too: a recipient called `<b>` must not become markup.
  const body = `
    <mj-text font-size="15px" color="#334155" line-height="24px">Hi ${escapeHtml(name)},</mj-text>
    ${html ? richBlock(html) : paragraphs(message)}`;
  return mjmlShell(escapeHtml(subject), body);
}
