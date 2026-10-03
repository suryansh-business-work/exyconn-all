import type { DnsOverviewQuery } from '@exyconn/shell/graphql/generated';

/** One domain's DNS on both providers, as the page renders it. */
export type DnsOverview = DnsOverviewQuery['dnsOverview'];
export type DnsRecordRow = DnsOverview['records'][number];
