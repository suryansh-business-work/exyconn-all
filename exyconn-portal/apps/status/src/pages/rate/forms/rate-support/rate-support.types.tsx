import type { SubmitSupportCsatMutationVariables } from '@exyconn/shell/graphql/generated';

/** What the rating form sends: the generated mutation variables, without the link's token. */
export type RateSupportValues = Omit<SubmitSupportCsatMutationVariables, 'token'>;

export interface RateSupportFormProps {
  /** The token from the survey link the customer was emailed. */
  token: string;
  /** Called once the rating is recorded. */
  onRated: () => void;
  /** Leaves without rating — the public page sends them to the status site. */
  onCancel: () => void;
}
