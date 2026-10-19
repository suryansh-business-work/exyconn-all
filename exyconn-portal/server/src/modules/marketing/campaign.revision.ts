import { CampaignRevisionModel } from './campaign-revision.model';
import { blocking, contentChecks, type QualityCheck } from './campaign.checks';
import { compileEmail, loadFooter } from './campaign.render';
import { htmlToText } from './campaign.mjml';
import { badRequest } from '../../utils/errors';
import type { CampaignDocument } from './marketing.model';

export interface RevisionActor {
  id: string;
  name: string;
}

type DraftCampaign = Pick<
  CampaignDocument,
  | 'name'
  | 'subject'
  | 'preheader'
  | 'senderName'
  | 'senderEmail'
  | 'replyTo'
  | 'mjml'
  | 'preferenceCategoryId'
  | 'trackOpens'
  | 'trackClicks'
> & { _id: unknown };

/** The draft's checks, compiled exactly as a send would compile it. */
export async function checkDraft(campaign: DraftCampaign) {
  const footer = await loadFooter();
  const compiled = await compileEmail(
    { subject: campaign.subject, preheader: campaign.preheader, mjml: campaign.mjml },
    footer,
  );
  const checks = await contentChecks(
    {
      subject: campaign.subject,
      preheader: campaign.preheader,
      senderName: campaign.senderName,
      senderEmail: campaign.senderEmail,
      replyTo: campaign.replyTo,
      mjml: campaign.mjml,
      preferenceCategoryId: campaign.preferenceCategoryId,
    },
    compiled,
  );
  return { compiled, checks };
}

const describeBlocking = (checks: readonly QualityCheck[]) =>
  `Fix these before sending: ${checks.map((found) => found.message).join(' ')}`;

/**
 * Freezes the draft into the next revision — refused while any check is an error. A queued or
 * scheduled send reads only this, so later edits to the draft never reach it.
 */
export async function createSendingRevision(campaign: DraftCampaign, actor: RevisionActor) {
  const { compiled, checks } = await checkDraft(campaign);
  const errors = blocking(checks);
  if (errors.length > 0) {
    badRequest(describeBlocking(errors));
  }
  const campaignId = String(campaign._id);
  const latest = await CampaignRevisionModel.findOne({ campaignId })
    .sort({ version: -1 })
    .select('version')
    .lean();
  return CampaignRevisionModel.create({
    campaignId,
    version: (latest?.version ?? 0) + 1,
    campaignName: campaign.name,
    subject: campaign.subject,
    preheader: campaign.preheader,
    senderName: campaign.senderName,
    senderEmail: campaign.senderEmail,
    replyTo: campaign.replyTo,
    preferenceCategoryId: campaign.preferenceCategoryId,
    mjml: compiled.mjml,
    html: compiled.html,
    text: htmlToText(compiled.html),
    trackOpens: campaign.trackOpens,
    trackClicks: campaign.trackClicks,
    createdById: actor.id,
    createdByName: actor.name,
  });
}

export type CampaignRevisionDoc = Awaited<ReturnType<typeof createSendingRevision>>;
