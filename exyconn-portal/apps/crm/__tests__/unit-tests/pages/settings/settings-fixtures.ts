import {
  CrmObject,
  CrmOp,
  CrmPropertyType,
  GmailAccountStatus,
  type CrmPropertyFieldsFragment,
  type GmailAccountFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { CrmPropertyInfo } from '../../../../src/records/schema';

/** A saved custom property as `crmProperties` returns it. */
export function propertyRow(
  overrides: Partial<CrmPropertyFieldsFragment> = {},
): CrmPropertyFieldsFragment {
  return {
    __typename: 'CrmProperty',
    id: 'prop-1',
    object: CrmObject.Lead,
    key: 'lead_score',
    label: 'Lead score',
    type: CrmPropertyType.Number,
    required: false,
    description: '',
    order: 0,
    options: [],
    ...overrides,
  };
}

/** One property of a record type's schema as `crmObjectSchema` describes it. */
export function schemaProperty(overrides: Partial<CrmPropertyInfo> = {}): CrmPropertyInfo {
  return {
    __typename: 'CrmPropertyInfo',
    key: 'name',
    label: 'Name',
    type: CrmPropertyType.Text,
    required: true,
    builtIn: true,
    importable: true,
    description: 'Full name',
    filterOnly: false,
    ops: [CrmOp.Eq],
    options: [],
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
