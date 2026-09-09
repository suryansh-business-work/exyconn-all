import { CampaignSendModel } from './campaign-send.model';
import { resolveAudienceMembers, type AudienceMember } from './marketing.audience';
import { renderMergeFields, withUnsubscribeFooter, type MergeVars } from './marketing.merge';
import {
  issueUnsubscribeTokens,
  suppress,
  suppressedAmong,
  withdrawnConsentReason,
} from './marketing.suppression';
import { AudienceListModel } from './audience.model';
import { instrument, newTrackingToken } from './marketing.tracking';
import type { CampaignModel } from './marketing.model';
import { emailer } from '../email';
import { mailer } from '../../utils/mailer';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * How many copies are in flight at once.
 *
 * A five-figure audience sent one at a time holds the request — or the scheduler tick —
 * open for hours; sent all at once it trips the SMTP provider's rate limit and the whole
 * blast fails. A small fixed width is the shape that finishes and stays inside the quota.
 */
const SEND_CONCURRENCY = 5;

/** The campaign fields a send reads. Kept structural so a lean row fits as well as a doc. */
export interface SendableCampaign {
  _id: unknown;
  name: string;
  subject: string;
  body: string;
  templateKey?: string;
}

/** One recipient's outcome, before it is written to the send log. */
export interface SendOutcome {
  to: string;
  recipientName: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  error: string;
  /**
   * SHA-256 of the opaque token in this copy's tracking links. Empty for a skipped
   * recipient — nothing was sent, so there is nothing that could ever be opened.
   */
  trackingTokenHash?: string;
}

export interface SendCounts {
  sent: number;
  failed: number;
  skipped: number;
}

/** What one recipient's copy actually says, once their own values are merged in. */
export interface RenderedCampaign {
  subject: string;
  body: string;
  vars: MergeVars;
}

const countOf = (outcomes: readonly SendOutcome[], status: SendOutcome['status']): number =>
  outcomes.filter((outcome) => outcome.status === status).length;

export const countOutcomes = (outcomes: readonly SendOutcome[]): SendCounts => ({
  sent: countOf(outcomes, 'SENT'),
  failed: countOf(outcomes, 'FAILED'),
  skipped: countOf(outcomes, 'SKIPPED'),
});

/** Splits a list into fixed-width batches. Pure, so the concurrency rule is testable. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

/**
 * This recipient's copy of the campaign.
 *
 * Exported because the send drawer previews it: what a marketer sees before pressing send
 * has to be produced by the code that will send, or the preview is a second implementation
 * that quietly disagrees with the first.
 */
export function renderForMember(
  campaign: Pick<SendableCampaign, 'subject' | 'body'>,
  member: Pick<AudienceMember, 'email' | 'name' | 'company'>,
  unsubscribeUrl: string,
  /** Where the tracking links point, and this copy's own token. Omitted = no tracking. */
  tracking?: { origin: string; token: string },
): RenderedCampaign {
  const vars: MergeVars = {
    name: member.name,
    email: member.email,
    company: member.company,
    unsubscribeUrl,
  };
  const merged = renderMergeFields(campaign.body, vars);
  const withFooter = withUnsubscribeFooter(merged, unsubscribeUrl);
  return {
    subject: renderMergeFields(campaign.subject, vars),
    // The unsubscribe link is exempt: a legal obligation must not stop working because the
    // tracker is down.
    body: tracking
      ? instrument(withFooter, tracking.origin, tracking.token, [unsubscribeUrl])
      : withFooter,
    vars,
  };
}

/** Hands one rendered copy to the transport — the stored template, or the plain shell. */
async function deliver(
  campaign: SendableCampaign,
  member: AudienceMember,
  rendered: RenderedCampaign,
): Promise<void> {
  if (campaign.templateKey) {
    await emailer.send({
      template: campaign.templateKey,
      to: member.email,
      variables: { ...rendered.vars, subject: rendered.subject, body: rendered.body },
      triggeredBy: `campaign:${String(campaign._id)}`,
    });
    return;
  }
  await mailer.sendCustomEmail({
    name: member.name,
    email: member.email,
    subject: rendered.subject,
    message: rendered.body,
  });
}

/** Emails one member and reports what happened, rather than throwing at the first failure. */
async function sendOne(
  campaign: SendableCampaign,
  member: AudienceMember,
  unsubscribeUrl: string,
  origin: string,
): Promise<SendOutcome> {
  // One token per recipient per send, so an open can be attributed to a person — and only
  // the hash is kept, so a copy of the log is not a set of working links.
  const { token, tokenHash } = newTrackingToken();
  const base = { to: member.email, recipientName: member.name, trackingTokenHash: tokenHash };
  try {
    await deliver(
      campaign,
      member,
      renderForMember(campaign, member, unsubscribeUrl, { origin, token }),
    );
    return { ...base, status: 'SENT', error: '' };
  } catch (err) {
    logger.error({ err, email: member.email }, `Campaign "${campaign.name}" email failed`);
    return { ...base, status: 'FAILED', error: err instanceof Error ? err.message : 'Send failed' };
  }
}

/** Members split by whether the law and their own choices let us write to them. */
interface Consent {
  deliverable: AudienceMember[];
  skipped: SendOutcome[];
}

const skippedOutcome = (member: AudienceMember, reason: string): SendOutcome => ({
  to: member.email,
  recipientName: member.name,
  status: 'SKIPPED',
  error: reason,
});

/**
 * Removes everyone who must not be written to, and says why for each of them.
 *
 * A contact who has withdrawn consent in the CRM but is not yet on the suppression list is
 * added to it here — the CRM status is the signal, the suppression list is what every
 * future send actually checks, and leaving them out of sync is how somebody gets emailed
 * after asking not to be.
 */
async function applyConsent(members: readonly AudienceMember[]): Promise<Consent> {
  const suppressed = await suppressedAmong(members.map((member) => member.email));
  const consent: Consent = { deliverable: [], skipped: [] };

  for (const member of members) {
    const withdrawn = member.kind === 'CONTACT' ? withdrawnConsentReason(member.status) : undefined;
    if (suppressed.has(member.email)) {
      consent.skipped.push(skippedOutcome(member, 'On the suppression list'));
    } else if (withdrawn) {
      await suppress(member.email, withdrawn, `crm-contact:${member.id}`);
      consent.skipped.push(skippedOutcome(member, `Contact is ${member.status.toLowerCase()}`));
    } else {
      consent.deliverable.push(member);
    }
  }
  return consent;
}

/** Sends the deliverable members in fixed-width batches, keeping every outcome. */
async function sendBatched(
  campaign: SendableCampaign,
  members: readonly AudienceMember[],
  links: ReadonlyMap<string, string>,
  origin: string,
): Promise<SendOutcome[]> {
  const outcomes: SendOutcome[] = [];
  for (const batch of chunk(members, SEND_CONCURRENCY)) {
    const settled = await Promise.allSettled(
      batch.map((member) => sendOne(campaign, member, links.get(member.email) ?? '', origin)),
    );
    for (const [index, result] of settled.entries()) {
      outcomes.push(
        result.status === 'fulfilled'
          ? result.value
          : skippedOutcome(batch[index], 'The send never completed'),
      );
    }
  }
  return outcomes;
}

/** The audience a send names, with its membership already resolved. */
export async function loadAudience(audienceListId: string) {
  const audience = await AudienceListModel.findById(audienceListId).lean();
  if (!audience) {
    notFound('Audience list');
  }
  const members = await resolveAudienceMembers(audience);
  return { audience, members };
}

export interface SendResult extends SendCounts {
  outcomes: SendOutcome[];
}

/**
 * The real send: every member of the audience who may still be written to, each outcome
 * logged whether it worked, failed or was skipped.
 */
export async function sendToAudience(
  campaign: SendableCampaign,
  audienceListId: string,
  origin: string,
): Promise<SendResult> {
  const { audience, members } = await loadAudience(audienceListId);
  if (members.length === 0) {
    badRequest(`"${audience.name}" has nobody in it.`);
  }

  const campaignId = String(campaign._id);
  const { deliverable, skipped } = await applyConsent(members);
  const links = await issueUnsubscribeTokens(
    deliverable.map((member) => member.email),
    campaignId,
  );
  const unsubscribeUrls = new Map(
    [...links].map(([email, token]) => [email, `${origin}/unsubscribe?t=${token}`]),
  );

  const outcomes = [
    ...skipped,
    ...(await sendBatched(campaign, deliverable, unsubscribeUrls, origin)),
  ];
  await CampaignSendModel.insertMany(
    outcomes.map((outcome) => ({ ...outcome, campaignId, audienceListId })),
  );
  return { ...countOutcomes(outcomes), outcomes };
}

/** A preview to one address. Nothing is logged or stamped: it is not a send of the campaign. */
export async function sendPreview(
  campaign: SendableCampaign,
  testEmail: string,
  origin: string,
): Promise<void> {
  const email = testEmail.trim().toLowerCase();
  const [token] = [...(await issueUnsubscribeTokens([email], String(campaign._id))).values()];
  const member: AudienceMember = {
    id: 'test',
    email,
    name: email,
    company: '',
    status: 'ACTIVE',
    kind: 'CLIENT',
  };
  const outcome = await sendOne(campaign, member, `${origin}/unsubscribe?t=${token}`, origin);
  if (outcome.status !== 'SENT') {
    badRequest(`Test email to ${email} failed: ${outcome.error}`);
  }
}

/** The campaign document type the resolvers hand in, kept out of the send's own signature. */
export type CampaignDoc = InstanceType<typeof CampaignModel>;

/**
 * A send, plus the stamp that records it happened.
 *
 * The stamp is what the register, the overview tile and the scheduler's "already sent"
 * guard all read, so it belongs next to the send rather than in whichever caller
 * remembered to write it.
 */
export async function runCampaignSend(
  campaign: CampaignDoc,
  audienceListId: string,
  origin: string,
): Promise<SendResult> {
  const result = await sendToAudience(campaign, audienceListId, origin);
  campaign.lastSentAt = new Date();
  campaign.recipientsCount = result.sent;
  await campaign.save();
  return result;
}
