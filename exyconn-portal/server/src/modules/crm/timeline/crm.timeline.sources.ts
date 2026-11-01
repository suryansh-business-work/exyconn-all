import { ActivityModel } from '../activity.model';
import { DealModel } from '../deal.model';
import { LeadModel } from '../crm.model';
import { WebsiteSubmissionModel } from '../../website/models/submission.model';
import { ChatSessionModel } from '../../website-chat/models/chat-session.model';
import { SupportTicketModel } from '../../employee/support.model';
import { CampaignSendModel } from '../../marketing/campaign-send.model';
import { CampaignModel } from '../../marketing/marketing.model';
import { EmailLogModel } from '../../email/email-log.model';
import { CrmEmailMessageModel } from '../../gmail/gmail.models';
import { WhatsappDemoVisitorModel } from '../../../../../../demos/whatsapp-demo/server/src/visitor/visitor.model';
import {
  item,
  type TimelineItem,
  type TimelineKind,
  type TimelineTarget,
} from './crm.timeline.types';
import { coldEmailDraftPaths } from './crm.timeline.cold-email';
import { belongsTo } from './crm.timeline.filters';
import { decodeHtmlEntities } from '../../../utils/htmlEntities';

/**
 * Each reader returns the newest `limit` records of one kind that belong to the target: by
 * CRM link (activities, deals) or by any of the target's email addresses (everything a
 * person did before, or without, being a CRM record).
 */

const newest = { createdAt: -1 } as const;
const idOf = (doc: { _id: unknown }) => String(doc._id);

async function activities(target: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await ActivityModel.find(belongsTo.activity(target))
    .sort(newest)
    .limit(target.limit)
    .lean();
  const draftPaths = await coldEmailDraftPaths(rows);
  return rows.map((row) => {
    const draftPath = draftPaths.get(idOf(row)) ?? '';
    return item({
      id: `activity:${idOf(row)}`,
      kind: row.type as TimelineKind,
      at: row.createdAt,
      title: row.subject,
      summary: row.notes,
      actor: row.owner,
      status: row.done ? 'Done' : '',
      attachments: (row as { attachments?: TimelineItem['attachments'] }).attachments ?? [],
      url: draftPath,
      // A drafted cold email opens on its record's Cold emails tab; the rest open in place.
      opensPage: Boolean(draftPath),
      remindAt: row.remindAt ?? null,
    });
  });
}

async function deals(target: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await DealModel.find(belongsTo.deal(target)).sort(newest).limit(target.limit).lean();
  return rows.map((row) =>
    item({
      id: `deal:${idOf(row)}`,
      kind: 'DEAL',
      at: row.createdAt,
      title: `Deal: ${row.title}`,
      summary: `${row.stage} · ${row.value}`,
      actor: row.owner,
      status: row.stage,
      url: '/deals/list',
    }),
  );
}

async function leads(target: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await LeadModel.find(belongsTo.lead(target)).sort(newest).limit(target.limit).lean();
  return rows.map((row) =>
    item({
      id: `lead:${idOf(row)}`,
      kind: 'LEAD',
      at: row.createdAt,
      title: `Became a lead from ${row.source}`,
      summary: row.notes,
      actor: row.owner,
      status: row.stage,
      url: '/leads',
    }),
  );
}

async function formSubmissions(target: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await WebsiteSubmissionModel.find(belongsTo.submission(target))
    .sort(newest)
    .limit(target.limit)
    .lean();
  return rows.map((row) => {
    // Matched on `submissionData.email`, so the data is always there.
    const data: Record<string, unknown> = row.submissionData;
    const message = typeof data.message === 'string' ? data.message : '';
    return item({
      id: `submission:${idOf(row)}`,
      kind: 'FORM_SUBMISSION',
      at: row.createdAt,
      title: `Submitted the ${row.formType} form on the website`,
      summary: message,
      status: row.status,
      url: '/website/submissions',
    });
  });
}

async function chats({ addresses, limit }: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await ChatSessionModel.find({ email: { $in: addresses } })
    .sort(newest)
    .limit(limit)
    .lean();
  return rows.map((row) =>
    item({
      id: `chat:${idOf(row)}`,
      kind: 'WEBSITE_CHAT',
      at: row.createdAt,
      title: `Chatted on the website (${row.messageCount} messages)`,
      summary: row.lastMessagePreview,
      actor: row.assigneeName,
      status: row.status,
      url: `/agents/chat/sessions/${idOf(row)}`,
      opensPage: true,
    }),
  );
}

async function tickets({ addresses, limit }: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await SupportTicketModel.find({ requesterEmail: { $in: addresses } })
    .sort(newest)
    .limit(limit)
    .lean();
  return rows.map((row) =>
    item({
      id: `ticket:${idOf(row)}`,
      kind: 'SUPPORT_TICKET',
      at: row.createdAt,
      title: `Support ticket ${row.reference}: ${row.subject}`,
      summary: row.description,
      actor: row.assigneeName,
      status: row.status,
      url: `/support/tickets/${idOf(row)}`,
      opensPage: true,
    }),
  );
}

async function campaignEmails({ addresses, limit }: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await CampaignSendModel.find({ to: { $in: addresses } })
    .sort({ sentAt: -1 })
    .limit(limit)
    .lean();
  const campaigns = await CampaignModel.find({ _id: { $in: rows.map((r) => r.campaignId) } })
    .select('name')
    .lean();
  const nameOf = new Map(campaigns.map((c) => [idOf(c), c.name]));
  return rows.map((row) =>
    item({
      id: `campaign:${idOf(row)}`,
      kind: 'CAMPAIGN_EMAIL',
      at: row.sentAt,
      title: `Received the campaign "${nameOf.get(row.campaignId) ?? 'email'}"`,
      summary: row.openedAt
        ? `Opened ${row.openCount ?? 1}×, clicked ${row.clickCount ?? 0}×`
        : 'Not opened',
      status: row.status,
      url: `/marketing/campaigns/${row.campaignId}`,
      opensPage: true,
    }),
  );
}

async function systemEmails(target: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await EmailLogModel.find(belongsTo.emailLog(target))
    .sort({ sentAt: -1 })
    .limit(target.limit)
    .lean();
  return rows.map((row) =>
    item({
      id: `email-log:${idOf(row)}`,
      kind: 'SYSTEM_EMAIL',
      at: row.sentAt,
      title: `Sent the email "${row.subject}"`,
      summary: row.templateName,
      actor: row.triggeredBy,
      status: row.status,
      url: '/tech/email/logs',
    }),
  );
}

async function whatsappLeads(target: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await WhatsappDemoVisitorModel.find(belongsTo.whatsapp(target))
    .sort(newest)
    .limit(target.limit)
    .lean();
  return rows.map((row) =>
    item({
      id: `whatsapp:${idOf(row)}`,
      kind: 'WHATSAPP_LEAD',
      at: row.createdAt,
      title: 'Signed up for the WhatsApp demo',
      summary: row.company ?? '',
      status: row.source,
      url: '/agents/whatsapp-leads',
    }),
  );
}

async function gmailMessages(target: TimelineTarget): Promise<TimelineItem[]> {
  const rows = await CrmEmailMessageModel.find(belongsTo.gmail(target))
    .sort({ sentAt: -1 })
    .limit(target.limit)
    .lean();
  return rows.map((row) =>
    item({
      id: `gmail:${idOf(row)}`,
      kind: 'EMAIL',
      at: row.sentAt,
      title:
        row.direction === 'OUT'
          ? `Emailed: ${row.subject}`
          : `Email from ${row.from}: ${row.subject}`,
      // Gmail sends the snippet HTML-escaped (`you&#39;re`); the timeline shows it as text.
      summary: decodeHtmlEntities(row.snippet),
      actor: row.sentByName ?? '',
      status: row.direction === 'OUT' ? 'Sent' : 'Received',
      url: `${target.recordPath}/emails`,
    }),
  );
}

export const TIMELINE_SOURCES = [
  gmailMessages,
  activities,
  deals,
  leads,
  formSubmissions,
  chats,
  tickets,
  campaignEmails,
  systemEmails,
  whatsappLeads,
];
