import type {
  ListContractsQuery,
  ContractType,
  ContractStatus,
} from '@exyconn/shell/graphql/generated';

export type ContractRow = ListContractsQuery['listContracts'][number];

export interface ContractFormValues {
  title: string;
  party: string;
  type: ContractType;
  effectiveDate: string;
  expiryDate: string;
  status: ContractStatus;
}
