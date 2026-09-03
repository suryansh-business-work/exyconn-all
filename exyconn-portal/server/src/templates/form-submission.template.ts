import { mjmlShell } from './layout.template';

export interface FormSubmissionEmailData {
  formType: string;
  submissionData: Record<string, unknown>;
}

/** Escapes text that goes into the MJML markup — every value here is public input. */
function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** "firstName" -> "First name", "india-offer" -> "India offer". */
function humanise(key: string): string {
  const spaced = key.replaceAll(/[_-]/g, ' ').replaceAll(/([a-z\d])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** Renders one submitted field as a labelled block. Objects are JSON-stringified. */
function field(key: string, value: unknown): string {
  const text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
  const safe = escape(text).replaceAll('\n', '<br />');
  return `
    <mj-text font-size="13px" color="#64748b" padding-bottom="2px">${escape(humanise(key))}</mj-text>
    <mj-text font-size="15px" color="#0b0a12" padding-top="0" padding-bottom="12px">${safe || '—'}</mj-text>`;
}

/**
 * Builds the internal notification for a form submitted on the public website.
 * The field set differs per form type, so every submitted key is rendered rather
 * than a fixed layout per form.
 */
export function formSubmissionTemplate(data: FormSubmissionEmailData): string {
  const heading = `New ${humanise(data.formType)} submission`;
  const rows = Object.entries(data.submissionData)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => field(key, value))
    .join('');
  const body = `
    <mj-text font-size="15px" color="#334155" line-height="24px" padding-bottom="16px">
      A visitor submitted the <strong>${escape(data.formType)}</strong> form on exyconn.com.
      The full record is in the portal under Website › Form Submissions.
    </mj-text>
    ${rows}`;
  return mjmlShell(heading, body);
}
