import type { ClutchEngine } from '@exyconn/shell/graphql/generated';

/** What a Clutch search asks for, as the form edits it. */
export interface ClutchSearchFormValues {
  engine: ClutchEngine;
  keyword: string;
  location: string;
  industry: string;
  /** Clutch profile links, one per chip. */
  profileUrls: string[];
  includeDetails: boolean;
  includeReviews: boolean;
  includePortfolio: boolean;
  /** Kept as a string because the number field's empty state is ''. */
  maxItems: string;
}
