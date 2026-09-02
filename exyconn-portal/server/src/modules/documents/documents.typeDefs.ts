import gql from 'graphql-tag';

export const documentsTypeDefs = gql`
  enum DocumentKind {
    OFFER_LETTER
    APPOINTMENT_LETTER
    SALARY_SLIP
    TAX
    EXPERIENCE
    RELIEVING
    POLICY
    OTHER
  }

  type EmployeeDocument {
    id: ID!
    employeeId: String!
    kind: DocumentKind!
    title: String!
    url: String!
    issuedOn: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input EmployeeDocumentInput {
    employeeId: String!
    kind: DocumentKind!
    title: String!
    url: String!
    issuedOn: DateTime!
  }

  type EmployeeDocumentPage {
    rows: [EmployeeDocument!]!
    totalCount: Int!
  }

  extend type Query {
    listEmployeeDocuments: [EmployeeDocument!]!
    listEmployeeDocumentsPaged(input: TableQueryInput!): EmployeeDocumentPage!
    listEmployeeDocumentsStats: TableStats!
    getEmployeeDocument(id: ID!): EmployeeDocument!
    myDocuments: [EmployeeDocument!]!
  }

  extend type Mutation {
    createEmployeeDocument(input: EmployeeDocumentInput!): EmployeeDocument!
    updateEmployeeDocument(id: ID!, input: EmployeeDocumentInput!): EmployeeDocument!
    deleteEmployeeDocument(id: ID!): Boolean!
  }
`;
