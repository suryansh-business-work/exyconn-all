import { createHash } from 'node:crypto';
import { GraphQLError } from 'graphql';
import { emailer } from '../email/email.service';
import { escapeHtml, rawHtml } from '../email/email.render';
import { platformOperatorOrganizationId } from '../../lib/platformAccess';
import { enforceLimit } from '../../lib/rateLimiter';
import { runForOrganization } from '../../lib/tenant';
import { isEmailAddress } from '../../utils/emailAddress';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { trimLeading, trimTrailing } from '../../utils/textTrim';
import { assertCaptcha } from '../website/website.captcha';
import { readEstimate } from './gcc.estimate';
import { emailIpLimiter, emailRecipientLimiter } from './gcc.limits';
import { renderEstimate } from './gcc.pdf';

export const GCC_ESTIMATE_TEMPLATE = 'gcc-estimate';
export const EMAIL_UNAVAILABLE = 'EMAIL_UNAVAILABLE';
const MAX_NOTE_LENGTH = 500;
const MAX_FILE_NAME = 60;

export interface CaptchaInput {
  token: string;
  answer: string;
}

export interface GccEmailInput {
  to: string;
  estimateJson: string;
  note?: string | null;
}

function unavailable(): never {
  throw new GraphQLError('We could not send the email just now. Please try again later.', {
    extensions: { code: EMAIL_UNAVAILABLE },
  });
}

/** The estimate's name as a file name: lowercase letters, digits and dashes. */
export function pdfFileName(name: string): string {
  const dashed = name
    .toLowerCase()
    .replaceAll(/[^a-z\d]+/g, '-')
    .slice(0, MAX_FILE_NAME);
  const slug = trimTrailing(trimLeading(dashed, '-'), '-');
  return `${slug || 'gcc-estimate'}.pdf`;
}

/** The summary as HTML lines; every line is the visitor's text, so each is escaped. */
const summaryHtml = (summary: string) =>
  rawHtml(summary.split('\n').map(escapeHtml).join('<br />'));

/** Rate-limit key for a recipient: hashed, so the limit store holds no address. */
const recipientKey = (to: string) => createHash('sha256').update(to).digest('hex');

/**
 * Emails an estimate as a PDF to the address the visitor gave.
 *
 * Every figure is recomputed here from the estimate's inputs. The email is the operator's —
 * its template, branding, SMTP account and log live in the platform operator organization —
 * so the send runs in that organization's scope. Success is reported only when the email
 * service says it sent; any failure is EMAIL_UNAVAILABLE.
 */
export async function emailGccEstimate(
  input: GccEmailInput,
  captcha: CaptchaInput,
  ip: string,
): Promise<string> {
  const to = input.to.trim().toLowerCase();
  if (!isEmailAddress(to)) {
    badRequest('Enter a valid email address.');
  }
  const note = (input.note ?? '').trim();
  if (note.length > MAX_NOTE_LENGTH) {
    badRequest(`Keep the note under ${MAX_NOTE_LENGTH} characters.`);
  }
  const estimate = readEstimate(input.estimateJson);
  await enforceLimit(emailIpLimiter, ip, 'estimate emails');
  await enforceLimit(emailRecipientLimiter, recipientKey(to), 'estimate emails to this address');
  // After the limits, so guessing at the question is throttled like any send.
  await assertCaptcha(captcha.token, captcha.answer);

  const operatorId = await platformOperatorOrganizationId();
  if (operatorId === null) {
    logger.error('GCC estimate email refused: no platform operator organization');
    unavailable();
  }
  try {
    await runForOrganization(operatorId, async () => {
      const { pdf, summary } = await renderEstimate(estimate);
      await emailer.send({
        template: GCC_ESTIMATE_TEMPLATE,
        to,
        variables: { estimateName: estimate.name, note, summary: summaryHtml(summary) },
        attachments: [{ filename: pdfFileName(estimate.name), content: pdf }],
        triggeredBy: 'exyconn.com GCC cost calculator',
      });
    });
  } catch (error) {
    // The error is not logged whole: a transport refusal can quote the recipient's address.
    const reason = error instanceof Error ? error.constructor.name : typeof error;
    logger.error({ reason }, 'GCC estimate email failed');
    unavailable();
  }
  logger.info('GCC estimate emailed');
  return to;
}
