import { UserModel } from '../admin/user.model';
import { compileEmail, loadFooter, personalize, type EmailContent } from './campaign.render';
import { contextForRecord } from './campaign.context';
import { verifiedSenders } from './campaign.sender';
import {
  missingValues,
  renderVariables,
  SAMPLE_RECIPIENT,
  type MessageContext,
  type RecipientContext,
} from './campaign.variables';
import { TRACKING_PATH } from './marketing.tracking';
import { mailer } from '../../utils/mailer';
import { badRequest } from '../../utils/errors';

/** The token preview links carry. The public pages recognise it and never act on it. */
export const PREVIEW_TOKEN = 'preview';

export interface PreviewInput extends EmailContent {
  campaignName: string;
  senderName: string;
  /** The CRM record to preview as; null previews the sample recipient. */
  recordKind?: 'CONTACT' | 'COMPANY' | null;
  recordId?: string | null;
}

/** Links that look real in the preview but can never unsubscribe anybody. */
function previewMessage(
  input: Pick<PreviewInput, 'campaignName' | 'senderName'>,
  origin: string,
): MessageContext {
  return {
    campaignName: input.campaignName,
    senderName: input.senderName,
    unsubscribeUrl: `${origin}/unsubscribe?t=${PREVIEW_TOKEN}`,
    preferencesUrl: `${origin}/email-preferences?t=${PREVIEW_TOKEN}`,
    viewInBrowserUrl: `${origin}${TRACKING_PATH}/v/${PREVIEW_TOKEN}`,
    year: new Date().getFullYear(),
  };
}

async function recipientFor(input: PreviewInput): Promise<RecipientContext> {
  if (!input.recordKind || !input.recordId) {
    return SAMPLE_RECIPIENT;
  }
  const context = await contextForRecord(input.recordKind, input.recordId);
  if (!context) {
    badRequest('That contact or company no longer exists.');
  }
  return context;
}

/**
 * The email as one recipient would get it, built by the pipeline the send uses — so the
 * preview cannot drift from what goes out.
 */
export async function previewContent(input: PreviewInput, origin: string) {
  const [footer, recipient] = await Promise.all([loadFooter(), recipientFor(input)]);
  const compiled = await compileEmail(input, footer);
  const message = previewMessage(input, origin);
  const copy = personalize(compiled, recipient, message);
  return {
    subject: copy.subject,
    preheader: renderVariables(input.preheader, recipient, message, 'text'),
    html: copy.html,
    text: copy.text,
    issues: compiled.issues,
    missingVariables: missingValues(
      `${input.subject} ${input.preheader} ${input.mjml}`,
      recipient,
      message,
    ),
    recipient: { kind: recipient.kind, name: recipient.recordName, email: recipient.email },
  };
}

const TEST_BANNER =
  '<div style="background:#fef3c7;color:#92400e;padding:10px;text-align:center;font:13px Arial,sans-serif">' +
  'Test email — its links do not unsubscribe anyone and nothing is tracked.</div>';

/** A test may go to the organization's own people or its sender address — never a customer. */
async function assertTestAddress(email: string): Promise<void> {
  const [isUser, senders] = await Promise.all([UserModel.exists({ email }), verifiedSenders()]);
  if (!isUser && !senders.includes(email)) {
    badRequest(
      'Test emails can only be sent to people with a portal account in your organization.',
    );
  }
}

/**
 * Sends one test copy: marked [TEST], with a banner, preview links and no tracking, and
 * recorded nowhere — it is not a send of the campaign.
 */
export async function sendTestEmail(
  input: PreviewInput & { replyTo: string },
  to: string,
  origin: string,
) {
  const email = to.trim().toLowerCase();
  await assertTestAddress(email);
  const [footer, recipient] = await Promise.all([loadFooter(), recipientFor(input)]);
  const compiled = await compileEmail(input, footer);
  if (compiled.issues.length > 0 || !compiled.html) {
    badRequest('Fix the MJML errors before sending a test.');
  }
  const copy = personalize(compiled, { ...recipient, email }, previewMessage(input, origin));
  await mailer.sendMarketingEmail({
    to: email,
    fromName: input.senderName,
    replyTo: input.replyTo,
    subject: `[TEST] ${copy.subject}`,
    html: copy.html.replace(/<body([^>]*)>/i, `<body$1>${TEST_BANNER}`),
    text: `[TEST]\n\n${copy.text}`,
    listUnsubscribeUrl: `${origin}${TRACKING_PATH}/u/${PREVIEW_TOKEN}`,
  });
}
