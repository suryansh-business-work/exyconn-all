import {
  ContractStatus,
  ContractType,
  DocumentCategory,
  DocumentStatus,
  type ContractSignaturesQuery,
} from '@exyconn/shell/graphql/generated';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import type { ContractRow } from '../../../../src/pages/legal/forms/contract';
import type { LegalDocumentRow } from '../../../../src/pages/legal/forms/document';

export type Signature = ContractSignaturesQuery['contractSignatures'][number];

/** A contract as the list queries return it: active, with a document, not yet signed. */
export function contractRow(overrides: Partial<ContractRow> = {}): ContractRow {
  return {
    __typename: 'Contract',
    id: 'contract-1',
    title: 'Master services agreement',
    party: 'Acme Inc',
    type: ContractType.Msa,
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expiryDate: '2027-01-01T00:00:00.000Z',
    status: ContractStatus.Active,
    documentUrl: 'https://cdn.example.com/msa.pdf',
    sentAt: null,
    signedBy: null,
    signedAt: null,
    ...overrides,
  };
}

/** A legal document as the list queries return it. */
export function documentRow(overrides: Partial<LegalDocumentRow> = {}): LegalDocumentRow {
  return {
    __typename: 'LegalDocument',
    id: 'document-1',
    title: 'Data processing addendum',
    category: DocumentCategory.Compliance,
    owner: 'Legal team',
    fileUrl: 'https://cdn.example.com/dpa.pdf',
    status: DocumentStatus.Final,
    ...overrides,
  };
}

/** A signature request that is still waiting for its signer. */
export function signature(overrides: Partial<Signature> = {}): Signature {
  return {
    __typename: 'ContractSignature',
    id: 'signature-1',
    signerName: 'Bob Stone',
    signerEmail: 'bob@acme.example',
    requestedByName: 'Priya',
    expiresAt: '2026-11-01T00:00:00.000Z',
    revokedAt: null,
    signedAt: null,
    signedName: '',
    signedIp: '',
    signedUserAgent: '',
    documentSha256: '',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * A `listXxxStats` result: `counts` is field -> value -> count, the shape the server's one
 * aggregation answers with.
 */
export function tableStats(
  total: number,
  counts: Record<string, Record<string, number>> = {},
): TableStatsShape {
  return {
    total,
    counts: Object.entries(counts).map(([field, buckets]) => ({
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
    })),
    sums: [],
  };
}
