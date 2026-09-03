import type { ListSalaryStructuresPagedQuery } from '@exyconn/shell/graphql/generated';

export type SalaryStructureRow =
  ListSalaryStructuresPagedQuery['listSalaryStructuresPaged']['rows'][number];

export interface SalaryStructureFormValues {
  employeeId: string;
  currency: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  effectiveFrom: string;
}
