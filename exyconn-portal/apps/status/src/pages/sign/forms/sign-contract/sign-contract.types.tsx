import type { ContractToSignQuery } from '@exyconn/shell/graphql/generated';

/** The contract as the public signing page sees it. */
export type ContractForSigning = NonNullable<ContractToSignQuery['contractToSign']>;

export interface SignContractFormProps {
  token: string;
  contract: ContractForSigning;
  /** Called with the hash of the document that was signed. */
  onSigned: (documentSha256: string) => void;
  /** Leaves without signing — the public page sends them to the status site. */
  onCancel: () => void;
}
