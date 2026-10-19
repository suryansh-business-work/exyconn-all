import {
  EmailVerificationBatchStatus,
  EmailVerificationSource,
  EmailVerificationStatus,
  type EmailVerificationBatchesQuery,
  type EmailVerificationFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type Batch = EmailVerificationBatchesQuery['emailVerificationBatches'][number];

/** One stored email check. */
export function verification(
  overrides: Partial<EmailVerificationFieldsFragment> = {},
): EmailVerificationFieldsFragment {
  return {
    id: 'verification-1',
    email: 'asha@acme.com',
    status: EmailVerificationStatus.Verified,
    reason: 'The mailbox exists',
    suggestion: '',
    syntaxValid: true,
    hasMx: true,
    deliverable: true,
    catchAll: false,
    disposable: false,
    roleAccount: false,
    source: EmailVerificationSource.Single,
    checkedBy: 'Priya',
    checkedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

/** One bulk check upload. */
export function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'batch-1',
    name: 'leads.csv',
    total: 8,
    processed: 3,
    status: EmailVerificationBatchStatus.Running,
    verified: 1,
    risky: 1,
    invalid: 1,
    unknown: 0,
    createdBy: 'Priya',
    createdAt: '2026-10-01T10:00:00.000Z',
    finishedAt: null,
    ...overrides,
  };
}
