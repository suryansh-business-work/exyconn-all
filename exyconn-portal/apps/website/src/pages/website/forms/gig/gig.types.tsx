import type { ListGigsQuery } from '@exyconn/shell/graphql/generated';

export type GigRow = ListGigsQuery['listGigs'][number];

export interface GigFormValues {
  gigCode: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  deliverables: string[];
  requirements: string[];
  tags: string[];
  budget: string;
  duration: string;
  status: string;
  applicationType: string;
  applicationContact: string;
  postedDate: string;
  deadline: string;
  isUrgent: boolean;
}
