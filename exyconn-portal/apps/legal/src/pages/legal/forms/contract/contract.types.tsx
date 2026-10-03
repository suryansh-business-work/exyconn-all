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
  /** The file a counterparty reads before signing; '' until one is attached. */
  documentUrl: string;
  /** The contract's text as rich-text HTML; '' until it is drafted. */
  content: string;
}
