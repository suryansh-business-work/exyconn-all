import type { StatusOverviewQuery } from '@exyconn/shell/graphql/generated';

/** The single public read behind the whole page, and the shapes hanging off it. */
export type StatusOverview = StatusOverviewQuery['statusOverview'];
export type StatusService = StatusOverview['services'][number];
export type StatusDay = StatusOverview['daily'][number];
export type StatusIncident = StatusOverview['incidents'][number];
