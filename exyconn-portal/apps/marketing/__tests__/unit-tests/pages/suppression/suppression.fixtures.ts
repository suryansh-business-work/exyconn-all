import {
  AudienceRecordKind,
  AuditAction,
  type MarketingSuppressionHistoryQuery,
  type MarketingSuppressionLookupQuery,
} from '@exyconn/shell/graphql/generated';
import type { PagedSuppressionRow } from '../../../../src/pages/suppression/suppression-grid';
import { suppressionRow } from '../../fixtures';

type Link = NonNullable<PagedSuppressionRow['linkedRecords']>[number];
type Lookup = MarketingSuppressionLookupQuery['marketingSuppressionLookup'];
type HistoryRow = MarketingSuppressionHistoryQuery['marketingSuppressionHistory'][number];

/** A CRM record that holds a suppressed address. */
export function link(overrides: Partial<Link> = {}): Link {
  return {
    __typename: 'SuppressionLink',
    kind: AudienceRecordKind.Contact,
    id: 'contact-1',
    name: 'Grace Hopper',
    emails: ['gone@acme.io', 'grace@home.io'],
    ...overrides,
  };
}

/** One row of the paged suppression grid, with its linked CRM records. */
export function pagedRow(overrides: Partial<PagedSuppressionRow> = {}): PagedSuppressionRow {
  return { ...suppressionRow(), linkedRecords: [], ...overrides };
}

/** The add form's lookup answer for an address. */
export function lookup(overrides: Partial<Lookup> = {}): Lookup {
  return {
    __typename: 'MarketingSuppressionLookup',
    email: 'gone@acme.io',
    existing: null,
    linkedRecords: [],
    ...overrides,
  };
}

/** One audit entry in a suppression's history. */
export function historyRow(overrides: Partial<HistoryRow> = {}): HistoryRow {
  return {
    __typename: 'AuditLog',
    id: 'audit-1',
    action: AuditAction.Create,
    actorName: 'Ada Admin',
    summary: 'Added gone@acme.io (Manual)',
    createdAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}
