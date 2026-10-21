import type { ClientDetailQuery, ClientSummaryQuery } from '@exyconn/shell/graphql/generated';

export type ClientDetail = ClientDetailQuery['getClient'];
export type ClientCounts = ClientSummaryQuery['clientSummary'];
