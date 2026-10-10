import type { MockLink } from '@apollo/client/testing';
import {
  ContractToSignDocument,
  ContractType,
  SignContractWithTokenDocument,
} from '@exyconn/shell/graphql/generated';
import type { ContractForSigning } from '../../../../src/pages/sign/forms/sign-contract';

export const TOKEN = 'sign-token-1';
export const DOCUMENT_HASH = 'a3f1c2'.repeat(10);

export const contract = (overrides: Partial<ContractForSigning> = {}): ContractForSigning => ({
  __typename: 'ContractToSign',
  title: 'MSA 2026',
  party: 'Globex Ltd',
  type: ContractType.Msa,
  effectiveDate: '2026-01-01',
  expiryDate: '2026-12-31',
  documentUrl: 'https://files.example.com/msa-2026.pdf',
  signerName: 'Ada Lovelace',
  signedAt: null,
  ...overrides,
});

export const contractLookup = (value: ContractForSigning | null): MockLink.MockedResponse => ({
  request: { query: ContractToSignDocument, variables: { token: TOKEN } },
  result: { data: { contractToSign: value } },
});

/** A mutation answer that carries no data and no error. */
export const signedWithoutData = (signedName: string): MockLink.MockedResponse => ({
  request: { query: SignContractWithTokenDocument, variables: { token: TOKEN, signedName } },
  result: { data: null },
});

export const signed = (signedName: string, error?: Error): MockLink.MockedResponse => ({
  request: { query: SignContractWithTokenDocument, variables: { token: TOKEN, signedName } },
  ...(error
    ? { error }
    : {
        result: {
          data: {
            signContractWithToken: {
              __typename: 'ContractSignedReceipt',
              signedAt: '2026-09-07T10:00:00.000Z',
              documentSha256: DOCUMENT_HASH,
            },
          },
        },
      }),
});
