import type { ApplicantFieldsFragment, ApplicantSource } from '@exyconn/shell/graphql/generated';

export type ApplicantRow = ApplicantFieldsFragment;

/** What the manual-entry form collects; the stage is moved separately. */
export interface ApplicantFormValues {
  name: string;
  email: string;
  phone: string;
  jobCode: string;
  jobTitle: string;
  companySlug: string;
  resumeUrl: string;
  coverLetter: string;
  source: ApplicantSource;
  rating: number;
}
