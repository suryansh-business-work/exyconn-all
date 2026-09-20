import gql from 'graphql-tag';

export const legalTypeDefs = gql`
  enum ContractType {
    NDA
    MSA
    SOW
    EMPLOYMENT
  }
  enum ContractStatus {
    DRAFT
    ACTIVE
    EXPIRED
    TERMINATED
  }

  type Contract {
    id: ID!
    title: String!
    party: String!
    type: ContractType!
    effectiveDate: DateTime!
    expiryDate: DateTime!
    status: ContractStatus!
    "The document a counterparty is asked to read and sign. Empty until one is attached."
    documentUrl: String!
    sentAt: DateTime
    signedBy: String
    signedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  One request for a signature, and the evidence of it. Everything from the moment of
  signing onwards is written once and never again.
  """
  type ContractSignature {
    id: ID!
    signerName: String!
    signerEmail: String!
    requestedByName: String!
    expiresAt: DateTime!
    revokedAt: DateTime
    signedAt: DateTime
    "The name the signer typed — their mark, in their own words."
    signedName: String!
    signedIp: String!
    signedUserAgent: String!
    "SHA-256 of the document's bytes as they were when it was signed."
    documentSha256: String!
    createdAt: DateTime!
  }

  "What Legal gets back when a request is raised: the link, so it can be passed on by hand."
  type ContractSignatureRequest {
    id: ID!
    url: String!
  }

  "What a counterparty sees on the public signing page. Deliberately narrow."
  type ContractToSign {
    title: String!
    party: String!
    type: ContractType!
    effectiveDate: DateTime!
    expiryDate: DateTime!
    documentUrl: String!
    signerName: String!
    "Set once it has been signed, so a revisited link says so rather than signing twice."
    signedAt: DateTime
  }

  input ContractInput {
    title: String!
    party: String!
    type: ContractType!
    effectiveDate: DateTime!
    expiryDate: DateTime!
    status: ContractStatus!
    documentUrl: String
  }

  type ContractPage {
    rows: [Contract!]!
    totalCount: Int!
  }

  enum DocumentCategory {
    POLICY
    CONTRACT
    COMPLIANCE
    OTHER
  }
  enum DocumentStatus {
    DRAFT
    FINAL
    ARCHIVED
  }

  type LegalDocument {
    id: ID!
    title: String!
    category: DocumentCategory!
    owner: String
    fileUrl: String
    status: DocumentStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input LegalDocumentInput {
    title: String!
    category: DocumentCategory!
    owner: String
    fileUrl: String
    status: DocumentStatus!
  }

  type LegalDocumentPage {
    rows: [LegalDocument!]!
    totalCount: Int!
  }

  extend type Query {
    listContracts: [Contract!]!
    listContractsPaged(input: TableQueryInput!): ContractPage!
    listContractsStats: TableStats!
    getContract(id: ID!): Contract!
    "LEGAL: every signature request on one contract, newest first, with its evidence."
    contractSignatures(contractId: ID!): [ContractSignature!]!
    """
    Unauthenticated — what the counterparty behind a signing link is shown. Null when the
    link is unknown, withdrawn or expired.
    """
    contractToSign(token: String!): ContractToSign
    listLegalDocuments: [LegalDocument!]!
    listLegalDocumentsPaged(input: TableQueryInput!): LegalDocumentPage!
    listLegalDocumentsStats: TableStats!
    getLegalDocument(id: ID!): LegalDocument!
  }

  "Confirmation the signer sees, and the hash they can check the document against later."
  type ContractSignedReceipt {
    signedAt: DateTime!
    documentSha256: String!
  }

  extend type Mutation {
    createContract(input: ContractInput!): Contract!
    updateContract(id: ID!, input: ContractInput!): Contract!
    deleteContract(id: ID!): Boolean!
    """
    LEGAL: ask a counterparty to sign. Emails them a link nobody else has and returns it,
    so it can also be passed on by hand.
    """
    requestContractSignature(
      contractId: ID!
      signerName: String!
      signerEmail: String!
      message: String
    ): ContractSignatureRequest!
    "LEGAL: withdraw an unsigned request. A signed one is evidence and cannot be withdrawn."
    revokeContractSignature(id: ID!): Boolean!
    """
    LEGAL: sign our own side. The signer is the account making the request, not a name typed
    into a field, and the document's hash is recorded with it.
    """
    signContract(id: ID!): Contract!
    """
    Unauthenticated — the counterparty signs with the link they were sent. Records the name
    they typed, where they answered from, and the hash of the document they were shown.
    """
    signContractWithToken(token: String!, signedName: String!): ContractSignedReceipt!

    createLegalDocument(input: LegalDocumentInput!): LegalDocument!
    updateLegalDocument(id: ID!, input: LegalDocumentInput!): LegalDocument!
    deleteLegalDocument(id: ID!): Boolean!
  }
`;
