import type { LoginMutation, LoginMutationVariables } from '@exyconn/shell/graphql/generated';

/** Shape of the login form values handled by Formik. */
export interface LoginFormValues {
  email: string;
  password: string;
}

export type { LoginMutation, LoginMutationVariables };
