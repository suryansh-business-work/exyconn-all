import type { MaAddActionCommentMutation } from '@exyconn/shell/graphql/generated';

/** The comment being written. */
export interface ActionCommentValues {
  text: string;
}

/** The item as the server returns it once the comment is on it. */
export type CommentedActionItem = MaAddActionCommentMutation['maAddActionComment'];
