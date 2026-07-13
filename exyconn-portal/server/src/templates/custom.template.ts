import { mjmlShell } from './layout.template';

export interface CustomEmailData {
  name: string;
  subject: string;
  message: string;
}

/** Escapes user-supplied text and converts newlines into MJML paragraphs. */
function paragraphs(message: string): string {
  return message
    .split(/\n{2,}/)
    .map((block) => {
      const safe = block
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br />');
      return `<mj-text font-size="15px" color="#334155" line-height="24px">${safe}</mj-text>`;
    })
    .join('');
}

/**
 * Builds the MJML markup for an admin-composed custom email. The subject becomes
 * the heading and the message body is wrapped in the branded shell.
 */
export function customTemplate(data: CustomEmailData): string {
  const { name, subject, message } = data;
  const body = `
    <mj-text font-size="15px" color="#334155" line-height="24px">Hi ${name},</mj-text>
    ${paragraphs(message)}`;
  return mjmlShell(subject, body);
}
