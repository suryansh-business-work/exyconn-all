import { personalize } from './campaign.render';
import { newTrackingToken, TRACKING_PATH } from './marketing.tracking';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import type { MessageContext, RecipientContext } from './campaign.variables';
import type { CampaignRevisionDocument } from './campaign-revision.model';

/** Attempts per copy: the first, and two retries for failures that are worth retrying. */
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1000, 4000];

/** Network failures nodemailer reports by code; a 4xx SMTP reply also means "try later". */
const TRANSIENT_CODES: ReadonlySet<string> = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ESOCKET',
  'EAI_AGAIN',
  'ECONNECTION',
]);

export interface CopyOutcome {
  to: string;
  recipientName: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  error: string;
  trackingTokenHash: string;
  attempts: number;
}

/** Everything about a run every copy needs. */
export interface RunSettings {
  revision: Pick<
    CampaignRevisionDocument,
    'campaignName' | 'subject' | 'html' | 'senderName' | 'replyTo' | 'trackOpens' | 'trackClicks'
  >;
  origin: string;
  /** Each address's unsubscribe token, minted for this run. */
  unsubscribeTokens: ReadonlyMap<string, string>;
}

/** A copy's personal links. The one-click address is the RFC 8058 POST endpoint. */
export function messageContext(
  settings: Pick<RunSettings, 'revision' | 'origin'>,
  unsubscribeToken: string,
  trackingToken: string,
): MessageContext & { listUnsubscribeUrl: string } {
  const { origin, revision } = settings;
  return {
    campaignName: revision.campaignName,
    senderName: revision.senderName,
    unsubscribeUrl: `${origin}/unsubscribe?t=${unsubscribeToken}`,
    preferencesUrl: `${origin}/email-preferences?t=${unsubscribeToken}`,
    viewInBrowserUrl: `${origin}${TRACKING_PATH}/v/${trackingToken}`,
    listUnsubscribeUrl: `${origin}${TRACKING_PATH}/u/${unsubscribeToken}`,
    year: new Date().getFullYear(),
  };
}

/** Whether a send failure is the kind that succeeds on a later attempt. */
export function isTransient(err: unknown): boolean {
  const error = err as { code?: string; responseCode?: number };
  if (error.code && TRANSIENT_CODES.has(error.code)) {
    return true;
  }
  return (
    typeof error.responseCode === 'number' && error.responseCode >= 400 && error.responseCode < 500
  );
}

const wait = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

/**
 * Renders and sends one copy, retrying transient failures with a growing pause. A permanent
 * refusal (bad address, rejected content) is reported at once — retrying it only spends quota.
 */
export async function deliverCopy(
  settings: RunSettings,
  recipient: RecipientContext,
): Promise<CopyOutcome> {
  const { token, tokenHash } = newTrackingToken();
  const message = messageContext(
    settings,
    settings.unsubscribeTokens.get(recipient.email) ?? '',
    token,
  );
  const copy = personalize(settings.revision, recipient, message, {
    origin: settings.origin,
    token,
    opens: settings.revision.trackOpens,
    clicks: settings.revision.trackClicks,
  });
  const base = {
    to: recipient.email,
    recipientName: recipient.fullName || recipient.recordName,
    trackingTokenHash: tokenHash,
  };
  // Attempts run one after another: a retry only follows the pause after a failed attempt.
  const send = async (attempt: number): Promise<CopyOutcome> => {
    try {
      await mailer.sendMarketingEmail({
        to: recipient.email,
        fromName: settings.revision.senderName,
        replyTo: settings.revision.replyTo,
        subject: copy.subject,
        html: copy.html,
        text: copy.text,
        listUnsubscribeUrl: message.listUnsubscribeUrl,
      });
      return { ...base, status: 'SENT', error: '', attempts: attempt };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Send failed';
      if (!isTransient(err) || attempt === MAX_ATTEMPTS) {
        logger.error({ err }, `Campaign "${settings.revision.campaignName}" copy failed`);
        return { ...base, status: 'FAILED', error, attempts: attempt };
      }
      await wait(RETRY_DELAYS_MS[attempt - 1]);
      return send(attempt + 1);
    }
  };
  return send(1);
}
