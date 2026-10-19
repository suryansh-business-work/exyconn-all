import { CheckSeverity, PreviewRecordKind } from '@exyconn/shell/graphql/generated';
import type { StudioOptions } from '../../../../../../src/pages/marketing/forms/campaign/studio/useStudioOptions';
import type {
  CampaignPreview,
  CampaignPreviewState,
} from '../../../../../../src/pages/marketing/forms/campaign/design/useCampaignPreview';
import type { PreviewRecord } from '../../../../../../src/pages/marketing/forms/campaign/personalize/PreviewAsField';
import type { useQualityChecks } from '../../../../../../src/pages/marketing/forms/campaign/studio/useQualityChecks';

/** The variable registry as the server sends it, one per group. */
export const VARIABLES: StudioOptions['variables'] = [
  {
    key: 'contact.firstName',
    group: 'CONTACT',
    label: 'First name',
    description: 'The contact’s first name.',
    example: 'Asha',
  },
  {
    key: 'contact.email',
    group: 'CONTACT',
    label: 'Email',
    description: 'The address the email goes to.',
    example: 'asha@example.com',
  },
  {
    key: 'company.name',
    group: 'COMPANY',
    label: 'Company name',
    description: 'The company of the contact.',
    example: 'Acme',
  },
  {
    key: 'unsubscribe_url',
    group: 'LINKS',
    label: 'Unsubscribe link',
    description: 'One-click unsubscribe.',
    example: 'https://x/u',
  },
  {
    key: 'custom.score',
    group: 'CUSTOM',
    label: 'Score',
    description: 'A custom field.',
    example: '42',
  },
];

export const CATEGORIES: StudioOptions['categories'] = [
  { id: 'cat-1', name: 'Offers', description: '', isActive: true, sortOrder: 1 },
];

export function studioOptions(overrides: Partial<StudioOptions> = {}): StudioOptions {
  return {
    verifiedSenders: ['hello@exyconn.com'],
    variables: VARIABLES,
    categories: CATEGORIES,
    loading: false,
    error: null,
    ...overrides,
  };
}

export function preview(overrides: Partial<CampaignPreview> = {}): CampaignPreview {
  return {
    subject: 'Hi Asha',
    preheader: 'Festive savings inside',
    html: '<p>Hi Asha</p>',
    text: 'Hi Asha',
    missingVariables: [],
    issues: [],
    recipient: { kind: 'SAMPLE', name: 'Asha', email: 'asha@example.com' },
    ...overrides,
  };
}

export function previewState(overrides: Partial<CampaignPreviewState> = {}): CampaignPreviewState {
  return { preview: preview(), updating: false, error: null, ...overrides };
}

export const CONTACT: PreviewRecord = {
  kind: PreviewRecordKind.Contact,
  id: 'contact-1',
  name: 'Asha Rao',
  email: 'asha@acme.in',
};

export const COMPANY: PreviewRecord = {
  kind: PreviewRecordKind.Company,
  id: 'company-1',
  name: 'Acme',
  email: '',
};

export type ChecksState = ReturnType<typeof useQualityChecks>;

export function checksState(overrides: Partial<ChecksState> = {}): ChecksState {
  return {
    report: {
      canSend: true,
      checks: [{ code: 'SPF', severity: CheckSeverity.Info, message: 'SPF is set up', line: null }],
      counts: {
        contacts: 3,
        companies: 1,
        clients: 0,
        recordsWithoutEmail: 0,
        rawEmails: 4,
        duplicates: 1,
        uniqueEmails: 3,
        invalid: 0,
        suppressed: 0,
        optedOut: 0,
        excluded: 0,
        eligible: 3,
      },
    },
    loading: false,
    error: null,
    run: () => undefined,
    ...overrides,
  };
}
