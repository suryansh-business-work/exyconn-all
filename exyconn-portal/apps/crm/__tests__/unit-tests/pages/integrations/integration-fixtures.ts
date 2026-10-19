import {
  CrmCallProvider,
  CrmSmsProvider,
  GmailAccountStatus,
  type CrmCallConfigFieldsFragment,
  type CrmSmsConfigFieldsFragment,
  type GmailAccountFieldsFragment,
  type MicrosoftMailAccountFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** A valid Twilio Account SID: AC and 32 hex characters. */
export const TWILIO_SID = `AC${'0123456789abcdef'.repeat(2)}`;

/** A stored Twilio call account, as the configs query returns it. */
export function callConfigRow(
  overrides: Partial<CrmCallConfigFieldsFragment> = {},
): CrmCallConfigFieldsFragment {
  return {
    id: 'call-1',
    label: 'Sales line',
    provider: CrmCallProvider.Twilio,
    fromNumber: '+14155550100',
    accountId: TWILIO_SID,
    hasAuthToken: true,
    authTokenHint: 'a1b2',
    isActive: true,
    updatedByName: 'Priya',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

/** A stored Twilio SMS account, as the configs query returns it. */
export function smsConfigRow(
  overrides: Partial<CrmSmsConfigFieldsFragment> = {},
): CrmSmsConfigFieldsFragment {
  return {
    id: 'sms-1',
    label: 'Sales texts',
    provider: CrmSmsProvider.Twilio,
    fromNumber: '+14155550100',
    accountId: TWILIO_SID,
    senderId: '',
    templateId: '',
    messageVariable: '',
    hasAuthToken: true,
    authTokenHint: null,
    isActive: true,
    updatedByName: 'Priya',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

/** A connected Microsoft mailbox. */
export function microsoftAccount(
  overrides: Partial<MicrosoftMailAccountFieldsFragment> = {},
): MicrosoftMailAccountFieldsFragment {
  return {
    id: 'ms-1',
    email: 'sales@acme.io',
    enabled: true,
    status: GmailAccountStatus.Connected,
    lastError: '',
    connectedAt: '2026-10-01T10:00:00.000Z',
    connectedByName: 'Priya',
    lastUsedAt: null,
    ...overrides,
  };
}

/** A connected Gmail mailbox. */
export function gmailAccount(
  overrides: Partial<GmailAccountFieldsFragment> = {},
): GmailAccountFieldsFragment {
  return {
    __typename: 'GmailAccount',
    id: 'gmail-1',
    email: 'sales@acme.io',
    enabled: true,
    status: GmailAccountStatus.Connected,
    lastError: '',
    connectedAt: '2026-10-01T10:00:00.000Z',
    connectedByName: 'Priya',
    lastSyncAt: null,
    ...overrides,
  };
}
