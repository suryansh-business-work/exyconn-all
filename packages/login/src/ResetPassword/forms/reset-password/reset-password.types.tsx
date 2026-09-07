import type {
  ResetPasswordMutation,
  ResetPasswordMutationVariables,
} from '@exyconn/shell/graphql/generated';

/** What the reset screen collects; the token comes from the link, not the form. */
export interface ResetPasswordValues {
  newPassword: string;
  confirmPassword: string;
}

export type { ResetPasswordMutation, ResetPasswordMutationVariables };
