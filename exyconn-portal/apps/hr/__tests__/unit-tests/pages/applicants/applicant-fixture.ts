import {
  ApplicantSource,
  ApplicantStage,
  type ApplicantFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** One applicant as the paged list returns them; override what a test cares about. */
export function applicantRow(
  patch: Partial<ApplicantFieldsFragment> = {},
): ApplicantFieldsFragment {
  return {
    __typename: 'Applicant',
    id: 'applicant-1',
    jobCode: 'GRP-SM-001',
    jobTitle: 'Sales manager',
    companySlug: 'acme',
    name: 'Asha Rao',
    email: 'asha@example.com',
    phone: '+91 98765 43210',
    resumeUrl: 'https://files.example.com/asha.pdf',
    coverLetter: 'I would love to join.',
    source: ApplicantSource.Website,
    stage: ApplicantStage.Screening,
    rating: 4,
    notes: 'Strong first call.',
    submissionId: 'submission-1',
    stageChangedAt: '2026-03-05T12:00:00.000Z',
    createdAt: '2026-03-04T12:00:00.000Z',
    ...patch,
  };
}
