import gql from 'graphql-tag';

export const navLinkTypeDefs = gql`
  type NavLink {
    id: ID!
    label: String!
    href: String!
    description: String!
    category: String!
    keywords: String!
    isActive: Boolean!
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input NavLinkInput {
    label: String!
    href: String!
    description: String
    category: String!
    keywords: String
    isActive: Boolean
    order: Int
  }

  extend type Query {
    listNavLinks: [NavLink!]!
    getNavLink(id: ID!): NavLink!
    publicNavLinks: [NavLink!]!
  }

  extend type Mutation {
    createNavLink(input: NavLinkInput!): NavLink!
    updateNavLink(id: ID!, input: NavLinkInput!): NavLink!
    deleteNavLink(id: ID!): Boolean!
  }
`;
