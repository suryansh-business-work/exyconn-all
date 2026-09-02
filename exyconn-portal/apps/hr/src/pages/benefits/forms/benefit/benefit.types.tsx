import type { ListBenefitsPagedQuery, BenefitKind } from '@exyconn/shell/graphql/generated';

export type BenefitRow = ListBenefitsPagedQuery['listBenefitsPaged']['rows'][number];

export interface BenefitFormValues {
  employeeId: string;
  kind: BenefitKind;
  name: string;
  provider: string;
  reference: string;
  coverage: string;
  validFrom: string;
  validTo: string;
  documentUrl: string;
}
