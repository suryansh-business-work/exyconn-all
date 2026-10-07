import {
  AudienceSegment,
  CampaignChannel,
  CampaignStatus,
  SocialApp,
  SocialMediaPostOrigin,
  SocialMediaPostStatus,
  SocialNetwork,
  SuppressionReason,
  type AudienceListFieldsFragment,
  type CampaignFieldsFragment,
  type MarketingSuppressionFieldsFragment,
  type SocialAccountsQuery,
  type SocialAppStatusesQuery,
  type SocialMediaPostsQuery,
  type SocialNetworkRulesQuery,
} from '@exyconn/shell/graphql/generated';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';

type AccountRow = SocialAccountsQuery['socialAccounts'][number];
type ProviderRow = SocialAppStatusesQuery['socialAppStatuses'][number];
type PostRow = SocialMediaPostsQuery['socialMediaPosts'][number];
type RuleRow = SocialNetworkRulesQuery['socialNetworkRules'][number];

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

export function campaignRow(
  overrides: Partial<CampaignFieldsFragment> = {},
): CampaignFieldsFragment {
  return {
    __typename: 'Campaign',
    id: 'campaign-1',
    name: 'Diwali offer',
    channel: CampaignChannel.Email,
    budget: 120000,
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2026-10-31T00:00:00.000Z',
    status: CampaignStatus.Active,
    subject: 'Festive savings',
    body: 'Hello {{name}}',
    templateKey: '',
    lastSentAt: null,
    recipientsCount: null,
    scheduledAt: null,
    scheduledAudienceListId: '',
    scheduleDispatchedAt: null,
    ...overrides,
  };
}

export function audienceRow(
  overrides: Partial<AudienceListFieldsFragment> = {},
): AudienceListFieldsFragment {
  return {
    __typename: 'AudienceList',
    id: 'audience-1',
    name: 'Newsletter',
    description: 'Monthly readers',
    clientIds: ['client-1'],
    contactIds: ['contact-1', 'contact-2'],
    dynamicSegment: AudienceSegment.None,
    segmentValue: '',
    ...overrides,
  };
}

export function suppressionRow(
  overrides: Partial<MarketingSuppressionFieldsFragment> = {},
): MarketingSuppressionFieldsFragment {
  return {
    __typename: 'MarketingSuppression',
    id: 'suppression-1',
    email: 'gone@acme.io',
    reason: SuppressionReason.Unsubscribed,
    source: 'Footer link',
    createdAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}

export function accountRow(overrides: Partial<AccountRow> = {}): AccountRow {
  return {
    __typename: 'SocialAccount',
    id: 'fb-1',
    network: SocialNetwork.Facebook,
    app: SocialApp.Meta,
    name: 'Acme',
    handle: '@acme',
    avatarUrl: '',
    expiresAt: null,
    lastSyncedAt: null,
    syncError: '',
    createdAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}

export function providerRow(overrides: Partial<ProviderRow> = {}): ProviderRow {
  return {
    __typename: 'SocialAppStatus',
    app: SocialApp.Meta,
    label: 'Meta',
    available: true,
    networks: [SocialNetwork.Facebook, SocialNetwork.Instagram],
    ...overrides,
  };
}

export function postRow(overrides: Partial<PostRow> = {}): PostRow {
  return {
    __typename: 'SocialMediaPost',
    id: 'post-1',
    accountId: 'fb-1',
    network: SocialNetwork.Facebook,
    origin: SocialMediaPostOrigin.Composed,
    status: SocialMediaPostStatus.Scheduled,
    text: 'Our autumn launch',
    mediaUrl: '',
    link: '',
    permalink: '',
    scheduledAt: '2026-09-20T10:00:00.000Z',
    publishedAt: null,
    error: '',
    engagement: 0,
    batchId: 'batch-1',
    createdAt: '2026-09-01T10:00:00.000Z',
    metrics: { __typename: 'SocialMediaPostMetrics', likes: 4, comments: 2, shares: 1, views: 90 },
    ...overrides,
  };
}

export function ruleRow(network: SocialNetwork, overrides: Partial<RuleRow> = {}): RuleRow {
  return {
    __typename: 'SocialNetworkRule',
    network,
    canPublish: true,
    maxChars: 63206,
    requiresImage: false,
    allowsImage: true,
    note: '',
    ...overrides,
  };
}

/** A query hook's answer once the server has replied, with a refetch that succeeds. */
export function answered<TData>(data: TData) {
  return { data, loading: false, error: undefined, refetch: () => Promise.resolve({ data }) };
}

/** A query hook's answer before the server has replied. */
export function pending() {
  return {
    data: undefined,
    loading: true,
    error: undefined,
    refetch: () => Promise.resolve({}),
  };
}
