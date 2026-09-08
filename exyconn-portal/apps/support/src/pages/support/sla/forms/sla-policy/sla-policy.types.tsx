import type { SupportSlaPolicyFieldsFragment } from '@exyconn/shell/graphql/generated';

/** One policy row, as the grid and the form both read it. */
export type SlaPolicyRow = SupportSlaPolicyFieldsFragment;

/** Bounds the form enforces, chosen so a typo cannot promise an unmeetable minute. */
export const SLA_MINUTE_LIMITS = { min: 1, max: 60 * 24 * 30 } as const;
