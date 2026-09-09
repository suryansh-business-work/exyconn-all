import type { SocialPostFieldsFragment, SocialPostInput } from '@exyconn/shell/graphql/generated';

/** A post as every screen renders it, straight off the generated fragment. */
export type SocialPostRow = SocialPostFieldsFragment;

/** What `createSocialPost` takes, so the form and the mutation cannot drift apart. */
export type SocialPostPayload = SocialPostInput;
