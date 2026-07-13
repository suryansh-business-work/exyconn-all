import type {
  ListContractsQuery,
  ContractType,
  ContractStatus,
} from '../../../../../graphql/generated';

export type ContractRow = ListContractsQuery['listContracts'][number];

export interface ContractFormValues {
  title: string;
  party: string;
  type: ContractType;
  effectiveDate: string;
  expiryDate: string;
  status: ContractStatus;
}
