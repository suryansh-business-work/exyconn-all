import type { SharedProjectQuery } from '@exyconn/shell/graphql/generated';

/** The project as a client sees it. NonNullable because the page guards on null first. */
export type SharedProjectView = NonNullable<SharedProjectQuery['sharedProject']>;

export type SharedMilestone = SharedProjectView['milestones'][number];

export type SharedTicketCount = SharedProjectView['ticketCounts'][number];
