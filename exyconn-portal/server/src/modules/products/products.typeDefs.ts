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
    "At or below this level the product counts as low stock."
    reorderLevel: Int!
    status: ProductStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    """
    Weighted average of what the stock on the shelf cost, moved by every receipt. Zero for a
    product that predates purchasing — its cost is genuinely unknown.
    """
    averageCost: Float!
  }

  input ProductInput {
    name: String!
    sku: String!
    price: Float!
    category: String!
    "Opening stock. Only honoured on create — afterwards the level moves through stock movements."
    stock: Int
    reorderLevel: Int
    status: ProductStatus!
  }

  type ProductPage {
    rows: [Product!]!
    totalCount: Int!
  }

  extend type Query {
    listProducts: [Product!]!
    listProductsPaged(input: TableQueryInput!): ProductPage!
    listProductsStats: TableStats!
    getProduct(id: ID!): Product!
    "What the stock on ACTIVE products cost: sum of averageCost × stock."
    inventoryValue: Float!
  }

  extend type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;
