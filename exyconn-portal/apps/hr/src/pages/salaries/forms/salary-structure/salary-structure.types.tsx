import type { ListSalaryStructuresPagedQuery } from '@exyconn/shell/graphql/generated';
import type { CompensationValues } from '@exyconn/shell/components/pay';

export type SalaryStructureRow =
  ListSalaryStructuresPagedQuery['listSalaryStructuresPaged']['rows'][number];

/** The compensation fields plus the employee this structure belongs to. */
export type SalaryStructureFormValues = CompensationValues & { employeeId: string };
