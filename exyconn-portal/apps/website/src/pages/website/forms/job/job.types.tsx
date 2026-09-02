import type { ListJobsQuery } from '@exyconn/shell/graphql/generated';

export type JobRow = ListJobsQuery['listJobs'][number];

export interface JobFormValues {
  jobCode: string;
  companySlug: string;
  title: string;
  category: string;
  skillSet: string[];
  shortJobDescription: string;
  jobDescription: string;
  jobResponsibilities: string;
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  location: string;
  jobType: string;
  experienceLevel: string;
  workMode: string;
  salaryRange: string;
  jobPostDate: string;
  applicationDeadline: string;
  isActive: boolean;
  isFeatured: boolean;
}
