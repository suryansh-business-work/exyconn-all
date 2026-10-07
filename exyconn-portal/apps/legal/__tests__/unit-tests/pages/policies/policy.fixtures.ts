import {
  PolicyAudience,
  PolicyCategory,
  PolicyClassification,
  PolicyStatus,
} from '@exyconn/shell/graphql/generated';
import type { PagedPolicyRow } from '../../../../src/pages/policies/policies-grid';

/** A published policy that asks people to sign, as the paged list returns it. */
export function policyRow(overrides: Partial<PagedPolicyRow> = {}): PagedPolicyRow {
  return {
    __typename: 'Policy',
    id: 'policy-1',
    title: 'Acceptable use',
    slug: 'acceptable-use',
    summary: 'How company devices may be used',
    body: '<p>Be sensible.</p>',
    audience: PolicyAudience.AllStaff,
    category: PolicyCategory.It,
    status: PolicyStatus.Published,
    version: 3,
    effectiveDate: '2026-04-15T00:00:00.000Z',
    requiresAcknowledgement: true,
    owner: 'IT',
    classification: PolicyClassification.Internal,
    nextReviewOn: '2027-04-15T00:00:00.000Z',
    reviewOverdue: false,
    approvedByName: 'Meera',
    approvedOn: null,
    publishedAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
    acknowledgedCount: 5,
    ...overrides,
  };
}
