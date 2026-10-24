import {
  ColdEmailStatus,
  ColdEmailTone,
  CrmTimelineObject,
  type ColdEmailDraftFieldsFragment,
  type ColdEmailVariantFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** An unsent version named after `id`; override what a test cares about. */
export const variant = (
  id: string,
  overrides: Partial<ColdEmailVariantFieldsFragment> = {},
): ColdEmailVariantFieldsFragment => ({
  id,
  subject: `Subject ${id}`,
  body: `Body ${id}`,
  instruction: '',
  tone: ColdEmailTone.Friendly,
  costUsd: 0.0012,
  createdAt: '2026-10-19T10:00:00.000Z',
  sentAt: null,
  sentMessageId: '',
  ...overrides,
});

/** Acme's draft holding `variants`, with room for ten. */
export const draft = (
  variants: ColdEmailVariantFieldsFragment[],
  overrides: Partial<ColdEmailDraftFieldsFragment> = {},
): ColdEmailDraftFieldsFragment => ({
  id: 'draft-1',
  object: CrmTimelineObject.Company,
  recordId: 'co-1',
  recordName: 'Acme',
  toEmail: 'hello@acme.com',
  status: ColdEmailStatus.Draft,
  variantCount: variants.length,
  maxVariants: 10,
  createdByName: 'Asha',
  updatedAt: '2026-10-19T10:00:00.000Z',
  goal: 'A checkout audit',
  tone: ColdEmailTone.Friendly,
  createdAt: '2026-10-19T09:00:00.000Z',
  brief: { about: '', fit: [] },
  variants,
  ...overrides,
});
