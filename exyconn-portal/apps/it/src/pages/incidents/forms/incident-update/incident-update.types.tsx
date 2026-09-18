import type { AddItIncidentUpdateMutationVariables } from '@exyconn/shell/graphql/generated';

/** One timeline entry: where the incident stands now, and what happened. */
export type IncidentUpdateValues = Pick<AddItIncidentUpdateMutationVariables, 'status' | 'note'>;
