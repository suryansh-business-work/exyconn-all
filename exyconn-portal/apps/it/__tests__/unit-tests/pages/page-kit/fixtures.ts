import {
  ItNetworkKind,
  ItPurchaseKind,
  ItPurchaseStatus,
  ItServiceStatus,
  ItVulnSeverity,
  ItVulnSource,
  ItVulnStatus,
  LicenceBillingCycle,
  LicenceStatus,
  PolicyAudience,
  PolicyCategory,
  PolicyClassification,
  PolicyStatus,
  type ItNetworkItemFieldsFragment,
  type ItPurchaseRequestFieldsFragment,
  type ItSettingsFieldsFragment,
  type ItVulnerabilityFieldsFragment,
  type LicenceFieldsFragment,
  type ListItPoliciesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';

type PolicyRow = ListItPoliciesPagedQuery['listItPoliciesPaged']['rows'][number];

/** The created/updated stamp every fixture row carries. */
export const STAMP = '2026-09-01T00:00:00.000Z';

/** A `listXxxStats` result: counts are field -> value -> count, sums are field -> total. */
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

/** A query that has not answered yet. */
export function pending() {
  return { data: undefined, loading: true, refetch: () => Promise.resolve({}) };
}

/** An ISO timestamp `days` from now. */
export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export function licenceRow(overrides: Partial<LicenceFieldsFragment> = {}): LicenceFieldsFragment {
  return {
    __typename: 'Licence',
    id: 'licence-1',
    name: 'Figma',
    vendor: 'Figma Inc',
    seatsTotal: 5,
    assigneeIds: [],
    cost: 1500,
    billingCycle: LicenceBillingCycle.Yearly,
    renewalDate: '2026-12-01T00:00:00.000Z',
    status: LicenceStatus.Active,
    notes: '',
    ...overrides,
  };
}

export function networkRow(
  overrides: Partial<ItNetworkItemFieldsFragment> = {},
): ItNetworkItemFieldsFragment {
  return {
    __typename: 'ItNetworkItem',
    id: 'net-1',
    name: 'Office Wi-Fi',
    kind: ItNetworkKind.Wifi,
    address: 'exy-office',
    location: 'Pune',
    provider: 'Airtel',
    status: ItServiceStatus.Active,
    notes: '',
    createdAt: STAMP,
    updatedAt: STAMP,
    ...overrides,
  };
}

export function purchaseRow(
  overrides: Partial<ItPurchaseRequestFieldsFragment> = {},
): ItPurchaseRequestFieldsFragment {
  return {
    __typename: 'ItPurchaseRequest',
    id: 'purchase-1',
    title: 'Laptops',
    kind: ItPurchaseKind.Hardware,
    quantity: 2,
    estimatedCost: 3000,
    requestedForName: '',
    justification: 'Two new joiners next month',
    status: ItPurchaseStatus.Requested,
    decidedByName: '',
    decidedAt: null,
    decisionNote: '',
    orderReference: '',
    receivedAt: null,
    createdAt: STAMP,
    updatedAt: STAMP,
    quotes: [],
    ...overrides,
  };
}

export function vulnerabilityRow(
  overrides: Partial<ItVulnerabilityFieldsFragment> = {},
): ItVulnerabilityFieldsFragment {
  return {
    __typename: 'ItVulnerability',
    id: 'vuln-1',
    title: 'XZ backdoor',
    cve: 'CVE-2024-3094',
    severity: ItVulnSeverity.Critical,
    source: ItVulnSource.VendorAdvisory,
    affectedSystem: 'Build servers',
    status: ItVulnStatus.Open,
    discoveredAt: '2026-09-01T00:00:00.000Z',
    dueAt: '2026-09-10T00:00:00.000Z',
    ownerName: 'Ravi',
    notes: '',
    createdAt: STAMP,
    updatedAt: STAMP,
    ...overrides,
  };
}

export function settingsRow(
  overrides: Partial<ItSettingsFieldsFragment> = {},
): ItSettingsFieldsFragment {
  return {
    __typename: 'ItSettings',
    id: 'settings-1',
    applications: ['Email', 'Slack'],
    onboardingApplications: ['Email'],
    ticketTopics: ['Hardware'],
    warrantyWarningDays: 60,
    renewalWarningDays: 30,
    certificateWarningDays: 30,
    updatedAt: STAMP,
    ...overrides,
  };
}

export function policyRow(overrides: Partial<PolicyRow> = {}): PolicyRow {
  return {
    __typename: 'Policy',
    id: 'policy-1',
    title: 'BYOD policy',
    slug: 'byod-policy',
    summary: '',
    body: '',
    audience: PolicyAudience.AllStaff,
    category: PolicyCategory.It,
    status: PolicyStatus.Draft,
    version: 1,
    effectiveDate: STAMP,
    requiresAcknowledgement: true,
    owner: 'IT',
    classification: PolicyClassification.Internal,
    nextReviewOn: null,
    reviewOverdue: false,
    approvedByName: '',
    approvedOn: null,
    publishedAt: null,
    updatedAt: STAMP,
    acknowledgedCount: 0,
    ...overrides,
  };
}
