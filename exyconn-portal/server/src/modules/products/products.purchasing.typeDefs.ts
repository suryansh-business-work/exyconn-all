import gql from 'graphql-tag';

export const productsPurchasingTypeDefs = gql`
  enum PurchaseOrderStatus {
    DRAFT
    ORDERED
    PARTIALLY_RECEIVED
    RECEIVED
    CANCELLED
  }

  """
  One ordered line. The unit cost is what gives received stock a cost basis — without it
  inventory can only be valued at the price we hope to sell for.
  """
  type PurchaseOrderLine {
    productId: String!
    productName: String!
    quantity: Int!
    unitCost: Float!
    taxPercent: Float!
    "How many have actually arrived. Written by a receipt, never by the form."
    receivedQuantity: Int!
  }

  input PurchaseOrderLineInput {
    productId: String!
    quantity: Int!
    unitCost: Float!
    taxPercent: Float!
  }

  "What arrived against one ordered line."
  input PurchaseReceiptLineInput {
    productId: String!
    quantity: Int!
  }

  type PurchaseOrder {
    id: ID!
    "Drawn from the shared counter, never typed."
    number: String!
    supplierId: String!
    supplierName: String!
    lines: [PurchaseOrderLine!]!
    "What the order costs, tax included — computed from the lines on read."
    total: Float!
    currency: String!
    status: PurchaseOrderStatus!
    orderDate: DateTime!
    expectedDate: DateTime
    notes: String!
    firstReceivedAt: DateTime
    receivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input PurchaseOrderInput {
    supplierId: String!
    lines: [PurchaseOrderLineInput!]!
    currency: String!
    status: PurchaseOrderStatus!
    orderDate: DateTime!
    expectedDate: DateTime
    notes: String
  }

  type PurchaseOrderPage {
    rows: [PurchaseOrder!]!
    totalCount: Int!
  }

  extend type Query {
    listPurchaseOrders: [PurchaseOrder!]!
    listPurchaseOrdersPaged(input: TableQueryInput!): PurchaseOrderPage!
    listPurchaseOrdersStats: TableStats!
    getPurchaseOrder(id: ID!): PurchaseOrder!
  }

  extend type Mutation {
    createPurchaseOrder(input: PurchaseOrderInput!): PurchaseOrder!
    updatePurchaseOrder(id: ID!, input: PurchaseOrderInput!): PurchaseOrder!
    deletePurchaseOrder(id: ID!): Boolean!
    """
    Books goods in: writes a RECEIPT movement carrying the order's cost, moves the product's
    average cost, and re-reads the order's status from what has actually arrived.
    """
    receivePurchaseOrder(id: ID!, lines: [PurchaseReceiptLineInput!]!): PurchaseOrder!
  }
`;
