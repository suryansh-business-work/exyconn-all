import { describe, expect, it } from 'vitest';
import {
  CampaignChannel,
  CampaignStatus,
  CampaignType,
  EditorMode,
} from '@exyconn/shell/graphql/generated';
import {
  CAMPAIGN_TYPE_OPTIONS,
  STEP_FIELDS,
  STUDIO_STEPS,
  campaignSchema,
  toDraftInput,
  toStudioValues,
  type CampaignStudioInput,
  type CampaignStudioValues,
} from '../../../../../../src/pages/marketing/forms/campaign/campaign.types';
import {
  designToMjml,
  newBlock,
} from '../../../../../../src/pages/marketing/forms/campaign/design/blocks';
import { campaignRow } from '../../../../fixtures';

/** A complete, valid set of studio values a test then breaks one field of. */
const valid = (overrides: Partial<CampaignStudioInput> = {}): CampaignStudioInput => ({
  ...toStudioValues(null, 'hello@exyconn.com', 'EUR'),
  name: 'Diwali offer',
  senderName: 'Exyconn',
  subject: 'Festive savings',
  scheduledAudienceListId: 'audience-1',
  ...overrides,
});

/** The first message the schema gives for a field, or undefined when the field is valid. */
const errorFor = (values: CampaignStudioInput, field: keyof CampaignStudioValues) => {
  const result = campaignSchema.safeParse(values);
  return result.success
    ? undefined
    : result.error.issues.find((issue) => issue.path[0] === field)?.message;
};

describe('campaignSchema', () => {
  it('accepts a complete campaign', () => {
    expect(campaignSchema.safeParse(valid()).success).toBe(true);
  });

  it.each([
    ['name', '   ', 'Name the campaign'],
    ['name', 'x'.repeat(121), 'Keep the name under 120 characters'],
    ['senderName', '', 'Add the name recipients see'],
    ['senderName', 'x'.repeat(101), 'Keep it under 100 characters'],
    ['senderEmail', ' ', 'Choose a verified sender address'],
    ['replyTo', 'not-an-email', 'Enter a valid email address'],
    ['subject', '', 'Add a subject line'],
    ['subject', 'x'.repeat(256), 'Keep the subject under 255 characters'],
    ['preheader', 'x'.repeat(201), 'Keep the preview text under 200 characters'],
    ['scheduledAudienceListId', '', 'Choose who receives this campaign'],
    ['mjml', '  ', 'The email has no content yet'],
  ] as const)('rejects %s = %j with “%s”', (field, value, message) => {
    expect(errorFor(valid({ [field]: value }), field)).toBe(message);
  });

  it('accepts the longest allowed values', () => {
    const values = valid({
      name: 'x'.repeat(120),
      senderName: 'x'.repeat(100),
      subject: 'x'.repeat(255),
      preheader: 'x'.repeat(200),
    });
    expect(campaignSchema.safeParse(values).success).toBe(true);
  });

  it('rejects an email over 500,000 characters', () => {
    expect(errorFor(valid({ mjml: 'x'.repeat(500_001) }), 'mjml')).toBe('The email is too large');
  });

  it('leaves the reply-to optional but checks it once typed', () => {
    expect(errorFor(valid({ replyTo: '' }), 'replyTo')).toBeUndefined();
    expect(errorFor(valid({ replyTo: ' sales@exyconn.com ' }), 'replyTo')).toBeUndefined();
  });

  it('rejects a negative budget and a budget that is not a number', () => {
    expect(errorFor(valid({ budget: -1 }), 'budget')).toBe('The budget cannot be negative');
    expect(errorFor(valid({ budget: '-0.5' }), 'budget')).toBe('The budget cannot be negative');
    expect(errorFor(valid({ budget: Number.NaN }), 'budget')).toBe('Enter a number');
    expect(errorFor(valid({ budget: 'abc' }), 'budget')).toBe('Enter a number');
    expect(errorFor(valid({ budget: 0 }), 'budget')).toBeUndefined();
  });

  it('reads the amount typed as text as a number, and an empty one as no budget', () => {
    expect(campaignSchema.parse(valid({ budget: '2500.50' })).budget).toBe(2500.5);
    expect(campaignSchema.parse(valid({ budget: '' })).budget).toBe(0);
  });

  it('needs an ISO 4217 currency for the budget, kept upper-cased', () => {
    expect(errorFor(valid({ budgetCurrency: '' }), 'budgetCurrency')).toBe('Currency is required');
    expect(errorFor(valid({ budgetCurrency: 'XYZ' }), 'budgetCurrency')).toBe(
      'Choose a valid ISO 4217 currency',
    );
    expect(errorFor(valid({ budgetCurrency: '₹' }), 'budgetCurrency')).toBe(
      'Choose a valid ISO 4217 currency',
    );
    expect(campaignSchema.parse(valid({ budgetCurrency: ' usd ' })).budgetCurrency).toBe('USD');
  });

  it('accepts only the known campaign types and editor modes', () => {
    const badType = { ...valid(), campaignType: 'SPAM' } as unknown as CampaignStudioValues;
    expect(campaignSchema.safeParse(badType).success).toBe(false);
    const badMode = { ...valid(), editorMode: 'WYSIWYG' } as unknown as CampaignStudioValues;
    expect(campaignSchema.safeParse(badMode).success).toBe(false);
  });

  it('trims the text it keeps', () => {
    const parsed = campaignSchema.parse(valid({ name: '  Offer  ', subject: ' Hi ' }));
    expect(parsed.name).toBe('Offer');
    expect(parsed.subject).toBe('Hi');
  });
});

describe('STUDIO_STEPS and STEP_FIELDS', () => {
  it('lists the six steps in order', () => {
    expect(STUDIO_STEPS.map((step) => step.slug)).toEqual([
      'setup',
      'audience',
      'design',
      'personalize',
      'test',
      'review',
    ]);
  });

  it('checks each step’s own fields, and nothing on the last two', () => {
    expect(STEP_FIELDS.setup).toEqual(
      expect.arrayContaining(['senderEmail', 'budget', 'budgetCurrency']),
    );
    expect(STEP_FIELDS.audience).toEqual(['scheduledAudienceListId']);
    expect(STEP_FIELDS.design).toEqual(['mjml']);
    expect(STEP_FIELDS.personalize).toEqual(['subject', 'preheader']);
    expect(STEP_FIELDS.test).toEqual([]);
    expect(STEP_FIELDS.review).toEqual([]);
  });

  it('only names fields the schema has', () => {
    const known = new Set(Object.keys(campaignSchema.shape));
    const named = Object.values(STEP_FIELDS).flat();
    expect(named.filter((field) => !known.has(field))).toEqual([]);
  });

  it('offers every campaign type once', () => {
    expect(new Set(CAMPAIGN_TYPE_OPTIONS.map((option) => option.value))).toEqual(
      new Set(Object.values(CampaignType)),
    );
  });
});

describe('toStudioValues', () => {
  it('starts a new campaign as a visual newsletter from the default sender', () => {
    const values = toStudioValues(null, 'hello@exyconn.com', 'EUR');
    expect(values).toMatchObject({
      name: '',
      campaignType: CampaignType.Newsletter,
      senderEmail: 'hello@exyconn.com',
      budget: 0,
      budgetCurrency: 'EUR',
      startDate: null,
      endDate: null,
      trackOpens: true,
      trackClicks: true,
      editorMode: EditorMode.Visual,
    });
    expect(values.design.blocks).toHaveLength(4);
    expect(values.mjml).toBe(designToMjml(values.design));
  });

  it('reopens a saved campaign with its own values', () => {
    const row = campaignRow({
      replyTo: 'reply@exyconn.com',
      preheader: 'Inside',
      trackOpens: false,
      scheduledAudienceListId: 'audience-1',
    });
    expect(toStudioValues(row, 'other@exyconn.com', 'EUR')).toMatchObject({
      name: 'Diwali offer',
      senderEmail: 'hello@exyconn.com',
      replyTo: 'reply@exyconn.com',
      preheader: 'Inside',
      budget: 120000,
      budgetCurrency: 'INR',
      startDate: '2026-10-01T00:00:00.000Z',
      trackOpens: false,
      scheduledAudienceListId: 'audience-1',
      editorMode: EditorMode.Code,
      mjml: '<mjml><mj-body></mj-body></mjml>',
    });
  });

  it('keeps a stored design and builds the MJML from it when none was saved', () => {
    const blocks = [newBlock('divider')];
    const row = campaignRow({ editorMode: EditorMode.Visual, blocks: { blocks }, mjml: '' });
    const values = toStudioValues(row, '', 'EUR');
    expect(values.design.blocks).toEqual(blocks);
    expect(values.mjml).toBe(designToMjml(values.design));
  });

  it('falls back to the default sender when the saved one is empty', () => {
    expect(
      toStudioValues(campaignRow({ senderEmail: '' }), 'x@exyconn.com', 'EUR').senderEmail,
    ).toBe('x@exyconn.com');
  });

  it('fills fields an old campaign row lacks', () => {
    const row = campaignRow({
      startDate: null,
      endDate: undefined,
      editorMode: undefined,
      campaignType: undefined,
      budgetCurrency: undefined,
    } as never);
    expect(toStudioValues(row, '', 'EUR')).toMatchObject({
      budgetCurrency: 'EUR',
      startDate: null,
      endDate: null,
      editorMode: EditorMode.Visual,
      campaignType: CampaignType.Newsletter,
    });
  });
});

describe('toDraftInput', () => {
  it('sends the design as blocks in visual mode, as a planned email', () => {
    const values = valid({ startDate: '2026-10-01T00:00:00.000Z' });
    const input = toDraftInput(values);
    expect(input).toMatchObject({
      name: 'Diwali offer',
      channel: CampaignChannel.Email,
      status: CampaignStatus.Planned,
      blocks: values.design,
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: undefined,
    });
    expect(input).not.toHaveProperty('design');
  });

  it('sends no design in code mode', () => {
    expect(toDraftInput(valid({ editorMode: EditorMode.Code })).blocks).toEqual({});
  });

  it('sends the amount as a number with its currency', () => {
    expect(toDraftInput(valid({ budget: '1500', budgetCurrency: 'USD' }))).toMatchObject({
      budget: 1500,
      budgetCurrency: 'USD',
    });
    expect(toDraftInput(valid({ budget: '' })).budget).toBe(0);
  });

  it('sends no currency before one is known, so the server uses the company one', () => {
    expect(toDraftInput(valid({ budgetCurrency: '' })).budgetCurrency).toBeUndefined();
  });

  it('sends an empty date as no date', () => {
    const input = toDraftInput(valid({ startDate: '', endDate: null }));
    expect(input.startDate).toBeUndefined();
    expect(input.endDate).toBeUndefined();
  });
});
