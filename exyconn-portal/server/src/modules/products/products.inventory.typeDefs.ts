import gql from 'graphql-tag';

/**
 * Suppliers and stock movements. Kept apart from `products.typeDefs.ts` so that
 * stays the catalogue schema it was.
 */
export const productsInventoryTypeDefs = gql`
  enum SupplierStatus {
    ACTIVE
    ON_HOLD
    INACTIVE
  }

  "Why a product's stock changed."
  enum MovementReason {
    RECEIPT
    ISSUE
    RETURN
    WRITE_OFF
    COUNT
  }

  type Supplier {
    id: ID!
    name: String!
    code: String!
    contactName: String!
    email: String!
    phone: String!
    status: SupplierStatus!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type StockMovement {
    id: ID!
    productId: String!
    productName: String!
    reason: MovementReason!
    "Always positive; the reason decides the direction."
    quantity: Int!
    "The stock level after this movement."
    stockAfter: Int!
    supplierId: String!
    supplierName: String!
    reference: String!
    notes: String!
    recordedBy: String!
    createdAt: DateTime!
  }

  input SupplierInput {
    name: String!
    code: String!
    contactName: String
    email: String
    phone: String
    status: SupplierStatus!
    notes: String
  }

  input StockMovementInput {
    productId: ID!
    reason: MovementReason!
    quantity: Int!
    supplierId: String
    reference: String
    notes: String
  }

  type SupplierPage {
    rows: [Supplier!]!
    totalCount: Int!
  }

  type StockMovementPage {
    rows: [StockMovement!]!
    totalCount: Int!
  }

  extend type Query {
    listSuppliers: [Supplier!]!
    listSuppliersPaged(input: TableQueryInput!): SupplierPage!
    listSuppliersStats: TableStats!
    getSupplier(id: ID!): Supplier!

    listStockMovements: [StockMovement!]!
    listStockMovementsPaged(input: TableQueryInput!): StockMovementPage!
    listStockMovementsStats: TableStats!
  }

  extend type Mutation {
    createSupplier(input: SupplierInput!): Supplier!
    updateSupplier(id: ID!, input: SupplierInput!): Supplier!
    deleteSupplier(id: ID!): Boolean!

    "Records a movement and moves the product's stock with it, in one step."
    recordStockMovement(input: StockMovementInput!): StockMovement!
  }
`;
