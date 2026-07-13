import gql from 'graphql-tag';

export const productsTypeDefs = gql`
  enum ProductStatus {
    ACTIVE
    DRAFT
    ARCHIVED
  }

  type Product {
    id: ID!
    name: String!
    sku: String!
    price: Float!
    category: String!
    stock: Int!
    status: ProductStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ProductInput {
    name: String!
    sku: String!
    price: Float!
    category: String!
    stock: Int!
    status: ProductStatus!
  }

  extend type Query {
    listProducts: [Product!]!
    getProduct(id: ID!): Product!
  }

  extend type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;
