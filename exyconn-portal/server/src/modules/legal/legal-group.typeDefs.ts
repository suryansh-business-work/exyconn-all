import gql from 'graphql-tag';

export const legalGroupTypeDefs = gql`
  "The registers Legal keeps: each can be grouped and handed to employees."
  enum LegalItemKind {
    CONTRACT
    POLICY
    DOCUMENT
  }

  "A named set of contracts, policies or documents, e.g. Part Time Employee Contracts."
  type LegalGroup {
    id: ID!
    name: String!
    kind: LegalItemKind!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input LegalGroupInput {
    name: String!
    kind: LegalItemKind!
    description: String
  }

  "A contract, policy or document that can be handed to an employee, with its group."
  type LegalAssignable {
    id: ID!
    kind: LegalItemKind!
    title: String!
    status: String!
    groupId: ID
    groupName: String
  }

  "One item handed to one employee, and who handed it over."
  type LegalAssignment {
    id: ID!
    kind: LegalItemKind!
    itemId: ID!
    title: String!
    status: String!
    groupName: String
    "The attached file (a contract's document, a document's file). Empty when there is none."
    fileUrl: String!
    "True when the item has text written in the portal to read."
    hasBody: Boolean!
    assignedByName: String!
    assignedAt: DateTime!
  }

  input LegalAssignmentItemInput {
    kind: LegalItemKind!
    itemId: ID!
  }

  extend type Query {
    "LEGAL: every group, of every kind."
    listLegalGroups: [LegalGroup!]!
    getLegalGroup(id: ID!): LegalGroup!
    "HR or LEGAL: everything that can be handed to an employee, with its group."
    legalAssignables: [LegalAssignable!]!
    "HR or LEGAL: what one employee has been handed."
    employeeLegalAssignments(userId: ID!): [LegalAssignment!]!
    "The contracts, policies and documents the signed-in person has been handed."
    myLegalAssignments: [LegalAssignment!]!
    "The text of one item the signed-in person has been handed, as rich-text HTML."
    myLegalAssignmentBody(id: ID!): String!
  }

  extend type Mutation {
    createLegalGroup(input: LegalGroupInput!): LegalGroup!
    updateLegalGroup(id: ID!, input: LegalGroupInput!): LegalGroup!
    "Deletes the group; its members stay, ungrouped."
    deleteLegalGroup(id: ID!): Boolean!
    "HR or LEGAL: hands these items to an employee. Already-held items are left as they are."
    assignLegalItems(userId: ID!, items: [LegalAssignmentItemInput!]!): [LegalAssignment!]!
    "HR or LEGAL: takes one item back."
    unassignLegalItem(id: ID!): Boolean!
  }
`;
