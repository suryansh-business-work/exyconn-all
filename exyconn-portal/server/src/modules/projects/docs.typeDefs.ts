import gql from 'graphql-tag';

export const docsTypeDefs = gql`
  "One page of a project's documentation. Pages nest through parentId."
  type DocPage {
    id: ID!
    projectId: ID!
    "Null for a top-level page; the parent's id for a page filed under another."
    parentId: ID
    title: String!
    "Rich text (HTML). Empty until somebody writes the page."
    body: String!
    order: Int!
    updatedByName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type Query {
    "Every page in a project's space, flat. The sidebar builds the tree from parentId."
    projectDocPages(projectId: ID!): [DocPage!]!
    docPage(id: ID!): DocPage!
  }

  extend type Mutation {
    createDocPage(projectId: ID!, parentId: ID, title: String!): DocPage!
    updateDocPage(id: ID!, title: String, body: String): DocPage!
    "Deletes the page and everything filed under it."
    deleteDocPage(id: ID!): Boolean!
    "Re-files a page under a new parent (null for top level) at a given position."
    moveDocPage(id: ID!, parentId: ID, toIndex: Int!): Boolean!
  }
`;
