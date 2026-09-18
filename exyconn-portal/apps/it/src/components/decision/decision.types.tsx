import type { ItDecision } from '@exyconn/shell/graphql/generated';

/** What the decision form collects. */
export interface DecisionValues {
  decision: ItDecision;
  note: string;
}

/** Sends the decision; the caller supplies the mutation for its own record type. */
export type DecideHandler = (values: DecisionValues) => Promise<unknown>;
