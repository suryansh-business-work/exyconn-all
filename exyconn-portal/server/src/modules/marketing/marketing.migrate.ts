import { AudienceListModel } from './audience.model';
import { MarketingSuppressionModel } from './suppression.model';
import { CampaignModel } from './marketing.model';
import { techTemplates } from './campaign-template.service';
import { wrapLegacyBody } from './campaign.mjml';
import { escapeHtml } from '../email/email.render';
import { inSequence } from '../../utils/inSequence';

/** An audience as releases before the builder stored it. */
interface LegacyAudience {
  _id: unknown;
  dynamicSegment?: string | null;
  segmentValue?: string | null;
}

/** The builder settings that reach the same people the old segment rule did. */
function fromSegment(audience: LegacyAudience) {
  const base = {
    companyEmailSource: 'BOTH',
    emailSelection: 'PRIMARY',
    emailTypes: [],
    updateMode: 'DYNAMIC',
    ruleCombinator: 'AND',
    companyIds: [],
    excludedEmails: [],
    snapshotAt: null,
  };
  switch (audience.dynamicSegment) {
    case 'ALL_ACTIVE_CONTACTS':
      return { ...base, recipientSource: 'CONTACTS', conditions: [], allActiveClients: false };
    case 'CONTACTS_BY_COMPANY_STATUS':
      return {
        ...base,
        recipientSource: 'CONTACTS',
        conditions: [
          { field: 'company.status', operator: 'EQUALS', value: audience.segmentValue ?? '' },
        ],
        allActiveClients: false,
      };
    case 'ALL_ACTIVE_CLIENTS':
      return { ...base, recipientSource: 'SELECTED_ONLY', conditions: [], allActiveClients: true };
    default:
      return { ...base, recipientSource: 'SELECTED_ONLY', conditions: [], allActiveClients: false };
  }
}

/**
 * Audiences saved as named people plus one segment rule become builder audiences that reach
 * the same people: rules for the segment, Data sources for the names, always dynamic. The
 * old fields are removed only after the new ones are written on the same row.
 */
export async function migrateLegacyAudiences(): Promise<void> {
  const legacy = await AudienceListModel.find({ recipientSource: { $exists: false } })
    .select('dynamicSegment segmentValue')
    .lean<LegacyAudience[]>({ strict: false } as never);
  // One row at a time, so a large backlog does not flood the connection pool at boot.
  await inSequence(legacy, (audience) =>
    AudienceListModel.updateOne(
      { _id: audience._id },
      { $set: fromSegment(audience), $unset: { dynamicSegment: 1, segmentValue: 1 } },
      { strict: false },
    ).exec(),
  );
}

/**
 * Suppression rows from before origins, scopes and notes were kept get them, worked out
 * from the source they recorded. Only missing fields are written; nothing is overwritten.
 */
export async function backfillSuppressionOrigins(): Promise<void> {
  const missing = { origin: { $exists: false } };
  await MarketingSuppressionModel.updateMany(
    { ...missing, source: /^campaign:/ },
    { $set: { origin: 'SUBSCRIBER' } },
  );
  await MarketingSuppressionModel.updateMany(
    { ...missing, source: /^crm-contact:/ },
    { $set: { origin: 'CRM' } },
  );
  await MarketingSuppressionModel.updateMany(missing, { $set: { origin: 'ADMIN' } });
  await MarketingSuppressionModel.updateMany(
    { scope: { $exists: false } },
    { $set: { scope: 'ORGANIZATION_MARKETING' } },
  );
  await MarketingSuppressionModel.updateMany({ note: { $exists: false } }, { $set: { note: '' } });
  await MarketingSuppressionModel.updateMany(
    { addedByName: { $exists: false } },
    { $set: { addedByName: '' } },
  );
}

/** A campaign as releases before the Email Studio stored it. */
interface LegacyCampaign {
  _id: unknown;
  subject?: string;
  body?: string;
  templateKey?: string;
  lastSentAt?: Date | null;
  scheduledAt?: Date | null;
  scheduleDispatchedAt?: Date | null;
}

/** The old body inside the Tech template it used to be sent through, or a plain layout. */
async function legacyMjml(campaign: LegacyCampaign): Promise<string> {
  const body = campaign.body ?? '';
  if (!campaign.templateKey) {
    return wrapLegacyBody(body);
  }
  const template = (await techTemplates()).find((row) => row.key === campaign.templateKey);
  if (!template) {
    return wrapLegacyBody(body);
  }
  return template.mjml
    .replaceAll(/\{\{\s*body\s*\}\}/g, body)
    .replaceAll(/\{\{\s*subject\s*\}\}/g, escapeHtml(campaign.subject ?? ''));
}

function legacySendState(campaign: LegacyCampaign): string {
  if (campaign.scheduledAt && !campaign.scheduleDispatchedAt) {
    return 'QUEUED';
  }
  return campaign.lastSentAt ? 'SENT' : 'DRAFT';
}

/**
 * Campaigns written before the Email Studio get the fields it reads — only where missing —
 * and their old body as MJML the studio can open, kept in the code editor. `body` itself is
 * left exactly as it was.
 */
export async function migrateLegacyCampaigns(): Promise<void> {
  const legacy = await CampaignModel.find({ sendState: { $exists: false } })
    .select('subject body templateKey lastSentAt scheduledAt scheduleDispatchedAt')
    .lean<LegacyCampaign[]>();
  // One row at a time, so a large backlog does not flood the connection pool at boot.
  await inSequence(legacy, async (campaign) =>
    CampaignModel.updateOne(
      { _id: campaign._id },
      {
        $set: {
          campaignType: 'OTHER',
          preferenceCategoryId: '',
          senderName: '',
          senderEmail: '',
          replyTo: '',
          preheader: '',
          editorMode: 'CODE',
          blocks: [],
          mjml: campaign.body ? await legacyMjml(campaign) : '',
          html: '',
          text: '',
          contentVersion: 1,
          trackOpens: true,
          trackClicks: true,
          sendState: legacySendState(campaign),
          sendingRevisionId: '',
          cancelRequestedAt: null,
        },
      },
    ),
  );
}
