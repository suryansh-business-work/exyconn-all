import type {
  RequestPasswordResetMutation,
  RequestPasswordResetMutationVariables,
} from '@exyconn/shell/graphql/generated';

/** What the forgot-password dialog collects. */
export interface ForgotPasswordValues {
  email: string;
}

export type { RequestPasswordResetMutation, RequestPasswordResetMutationVariables };
