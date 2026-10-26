import type { UnlockTechVaultInput } from '@exyconn/shell/graphql/generated';

/** What the person types to unlock: the emailed code and why they need the credentials. */
export type UnlockVaultFormValues = Pick<UnlockTechVaultInput, 'code' | 'reason'>;
