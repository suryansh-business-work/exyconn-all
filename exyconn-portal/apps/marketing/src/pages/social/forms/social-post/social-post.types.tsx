import type {
  SocialMediaPostsQuery,
  SocialNetworkRulesQuery,
} from '@exyconn/shell/graphql/generated';

export type SocialMediaPostRow = SocialMediaPostsQuery['socialMediaPosts'][number];
export type NetworkRule = SocialNetworkRulesQuery['socialNetworkRules'][number];

/** When a post goes out: now, at a chosen time, or not yet. */
export type PostTiming = 'NOW' | 'SCHEDULE' | 'DRAFT';

export interface SocialPostFormValues {
  /** The accounts to post to; a post being edited keeps its one account. */
  accountIds: string[];
  text: string;
  /** An uploaded image's URL, or ''. */
  mediaUrl: string;
  link: string;
  timing: PostTiming;
  /** ISO string; only read when scheduling. */
  scheduledAt: string;
}
