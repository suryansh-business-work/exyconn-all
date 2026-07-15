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
    sentAt: DateTime
    signedBy: String
    signedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ContractInput {
    title: String!
    party: String!
    type: ContractType!
    effectiveDate: DateTime!
    expiryDate: DateTime!
    status: ContractStatus!
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
    listLegalDocuments: [LegalDocument!]!
    listLegalDocumentsPaged(input: TableQueryInput!): LegalDocumentPage!
    listLegalDocumentsStats: TableStats!
    getLegalDocument(id: ID!): LegalDocument!
  }

  extend type Mutation {
    createContract(input: ContractInput!): Contract!
    updateContract(id: ID!, input: ContractInput!): Contract!
    deleteContract(id: ID!): Boolean!
    sendContract(id: ID!, email: String!, message: String): Contract!
    signContract(id: ID!, signedBy: String!): Contract!

    createLegalDocument(input: LegalDocumentInput!): LegalDocument!
    updateLegalDocument(id: ID!, input: LegalDocumentInput!): LegalDocument!
    deleteLegalDocument(id: ID!): Boolean!
  }
`;
