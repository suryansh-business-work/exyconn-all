import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import {
  CampaignChannel,
  CampaignStatus,
  CampaignType,
  EditorMode,
  type CampaignDraftInput,
  type CampaignFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { asDesign, designToMjml, starterDesign, type Design } from './design/blocks';

export type CampaignRow = CampaignFieldsFragment;

/** The wizard's steps, in order; the slug is what the URL carries. */
export const STUDIO_STEPS = [
  { slug: 'setup', label: 'Campaign setup' },
  { slug: 'audience', label: 'Audience' },
  { slug: 'design', label: 'Email design' },
  { slug: 'personalize', label: 'Personalization' },
  { slug: 'test', label: 'Test & preview' },
  { slug: 'review', label: 'Review & schedule' },
] as const;

export type StudioStep = (typeof STUDIO_STEPS)[number]['slug'];

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === '' || EMAIL.test(value), 'Enter a valid email address');

export const campaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name the campaign')
    .max(120, 'Keep the name under 120 characters'),
  campaignType: z.enum(CampaignType),
  preferenceCategoryId: z.string(),
  senderName: z
    .string()
    .trim()
    .min(1, 'Add the name recipients see')
    .max(100, 'Keep it under 100 characters'),
  senderEmail: z.string().trim().min(1, 'Choose a verified sender address'),
  replyTo: optionalEmail,
  subject: z
    .string()
    .trim()
    .min(1, 'Add a subject line')
    .max(255, 'Keep the subject under 255 characters'),
  preheader: z.string().trim().max(200, 'Keep the preview text under 200 characters'),
  budget: z.number({ error: 'Enter a number' }).min(0, 'The budget cannot be negative'),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  trackOpens: z.boolean(),
  trackClicks: z.boolean(),
  scheduledAudienceListId: z.string().min(1, 'Choose who receives this campaign'),
  editorMode: z.enum(EditorMode),
  design: z.custom<Design>(),
  mjml: z
    .string()
    .trim()
    .min(1, 'The email has no content yet')
    .max(500_000, 'The email is too large'),
});

export type CampaignStudioValues = z.infer<typeof campaignSchema>;

/** The fields each step must have right before moving on. */
export const STEP_FIELDS: Readonly<Record<StudioStep, (keyof CampaignStudioValues)[]>> = {
  setup: [
    'name',
    'campaignType',
    'senderName',
    'senderEmail',
    'replyTo',
    'subject',
    'preheader',
    'budget',
  ],
  audience: ['scheduledAudienceListId'],
  design: ['mjml'],
  personalize: ['subject', 'preheader'],
  test: [],
  review: [],
};

const toDateInput = (value?: string | null) => value ?? null;

export function toStudioValues(
  row: CampaignRow | null,
  defaultSender: string,
): CampaignStudioValues {
  const design = asDesign(row?.blocks) ?? starterDesign();
  const editorMode = row?.editorMode ?? EditorMode.Visual;
  return {
    name: row?.name ?? '',
    campaignType: row?.campaignType ?? CampaignType.Newsletter,
    preferenceCategoryId: row?.preferenceCategoryId ?? '',
    senderName: row?.senderName ?? '',
    senderEmail: row?.senderEmail || defaultSender,
    replyTo: row?.replyTo ?? '',
    subject: row?.subject ?? '',
    preheader: row?.preheader ?? '',
    budget: row?.budget ?? 0,
    startDate: toDateInput(row?.startDate),
    endDate: toDateInput(row?.endDate),
    trackOpens: row?.trackOpens ?? true,
    trackClicks: row?.trackClicks ?? true,
    scheduledAudienceListId: row?.scheduledAudienceListId ?? '',
    editorMode,
    design,
    mjml: row?.mjml || designToMjml(design),
  };
}

/** The values as a draft save sends them. The design travels only in visual mode. */
export function toDraftInput(values: CampaignStudioValues): CampaignDraftInput {
  const { design, ...rest } = values;
  return {
    ...rest,
    channel: CampaignChannel.Email,
    status: CampaignStatus.Planned,
    blocks: values.editorMode === EditorMode.Visual ? design : {},
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
  };
}

export const CAMPAIGN_TYPE_OPTIONS: ReadonlyArray<{ value: CampaignType; label: string }> = [
  { value: CampaignType.Newsletter, label: 'Newsletter' },
  { value: CampaignType.Promotional, label: 'Promotional' },
  { value: CampaignType.Announcement, label: 'Announcement' },
  { value: CampaignType.Event, label: 'Event' },
  { value: CampaignType.FollowUp, label: 'Follow-up' },
  { value: CampaignType.Other, label: 'Other' },
];
