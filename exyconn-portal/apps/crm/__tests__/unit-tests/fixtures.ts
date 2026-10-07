import {
  ActivitySubject,
  ActivityType,
  CompanyStatus,
  ContactStatus,
  DealStage,
  LeadSource,
  LeadStage,
  type ActivityFieldsFragment,
  type CompanyFieldsFragment,
  type ContactFieldsFragment,
  type DealFieldsFragment,
  type ListLeadsQuery,
} from '@exyconn/shell/graphql/generated';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';

type LeadRow = ListLeadsQuery['listLeads'][number];

/**
 * A `listXxxStats` result: `counts` is field -> value -> count, `sums` is field -> total,
 * the same shape the server's one aggregation answers with.
 */
export function tableStats(
  total: number,
  counts: Record<string, Record<string, number>> = {},
  sums: Record<string, number> = {},
): TableStatsShape {
  return {
    total,
    counts: Object.entries(counts).map(([field, buckets]) => ({
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
    })),
    sums: Object.entries(sums).map(([field, sum]) => ({ field, total: sum })),
  };
}

export function leadRow(overrides: Partial<LeadRow> = {}): LeadRow {
  return {
    __typename: 'Lead',
    id: 'lead-1',
    name: 'Asha Rao',
    email: 'asha@acme.io',
    source: LeadSource.Referral,
    stage: LeadStage.Qualified,
    value: 25000,
    owner: 'Priya',
    notes: '',
    campaignId: '',
    campaignName: '',
    convertedDealId: null,
    ...overrides,
  };
}

export function dealRow(overrides: Partial<DealFieldsFragment> = {}): DealFieldsFragment {
  return {
    __typename: 'Deal',
    id: 'deal-1',
    title: 'Acme rollout',
    companyId: 'company-1',
    companyName: 'Acme',
    contactId: 'contact-1',
    contactName: 'Asha Rao',
    stage: DealStage.Proposal,
    value: 120000,
    probability: 40,
    expectedCloseDate: null,
    owner: 'Priya',
    notes: '',
    clientId: '',
    ...overrides,
  };
}

export function companyRow(overrides: Partial<CompanyFieldsFragment> = {}): CompanyFieldsFragment {
  return {
    __typename: 'Company',
    id: 'company-1',
    name: 'Acme',
    domain: 'acme.io',
    industry: 'Software',
    size: '11-50',
    status: CompanyStatus.Prospect,
    phone: '',
    location: 'Pune',
    owner: 'Priya',
    notes: '',
    clientId: '',
    isClient: false,
    ...overrides,
  };
}

export function contactRow(overrides: Partial<ContactFieldsFragment> = {}): ContactFieldsFragment {
  return {
    __typename: 'Contact',
    id: 'contact-1',
    name: 'Asha Rao',
    email: 'asha@acme.io',
    phone: '',
    title: 'CTO',
    companyId: 'company-1',
    companyName: 'Acme',
    status: ContactStatus.Active,
    owner: 'Priya',
    notes: '',
    ...overrides,
  };
}

export function activityRow(
  overrides: Partial<ActivityFieldsFragment> = {},
): ActivityFieldsFragment {
  return {
    __typename: 'Activity',
    id: 'activity-1',
    type: ActivityType.Call,
    subject: 'Kick-off call',
    notes: '',
    relatedType: ActivitySubject.Deal,
    relatedId: 'deal-1',
    relatedName: 'Acme rollout',
    dueDate: null,
    done: false,
    owner: 'Priya',
    ...overrides,
  };
}

/** A query hook's answer once the server has replied, with a refetch that succeeds. */
export function answered<TData>(data: TData) {
  return { data, loading: false, refetch: () => Promise.resolve({ data }) };
}

/** A query hook's answer before the server has replied. */
export function pending() {
  return { data: undefined, loading: true, refetch: () => Promise.resolve({}) };
}
