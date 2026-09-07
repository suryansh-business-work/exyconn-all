import gql from 'graphql-tag';

export const assetsTypeDefs = gql`
  enum AssetCategory {
    LAPTOP
    DESKTOP
    MONITOR
    PHONE
    TABLET
    PERIPHERAL
    NETWORK
    SOFTWARE_LICENCE
    OTHER
  }

  enum AssetStatus {
    IN_STOCK
    ASSIGNED
    IN_REPAIR
    RETIRED
    LOST
  }

  type Asset {
    id: ID!
    assetTag: String!
    name: String!
    category: AssetCategory!
    status: AssetStatus!
    manufacturer: String!
    modelName: String!
    serialNumber: String!
    assignedToId: String!
    assignedToName: String!
    location: String!
    purchaseDate: DateTime
    warrantyExpiry: DateTime
    purchaseCost: Float!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input AssetInput {
    assetTag: String!
    name: String!
    category: AssetCategory!
    status: AssetStatus!
    manufacturer: String
    modelName: String
    serialNumber: String
    assignedToId: String
    assignedToName: String
    location: String
    purchaseDate: DateTime
    warrantyExpiry: DateTime
    purchaseCost: Float
    notes: String
  }

  type AssetPage {
    rows: [Asset!]!
    totalCount: Int!
  }

  "One spell of an asset being held by one person. Open while returnedAt is null."
  type AssetAssignment {
    id: ID!
    assetId: ID!
    assetTag: String!
    employeeId: String!
    employeeName: String!
    assignedAt: DateTime!
    "Null while the person still holds it."
    returnedAt: DateTime
    assignedByName: String!
    note: String!
  }

  "Just enough of an employee to put them in the 'assigned to' picker."
  type AssetAssignee {
    id: ID!
    name: String!
    email: String!
  }

  extend type Query {
    listAssets: [Asset!]!
    listAssetsPaged(input: TableQueryInput!): AssetPage!
    listAssetsStats: TableStats!
    getAsset(id: ID!): Asset!
    "Employees an asset can be handed to."
    listAssetAssignees: [AssetAssignee!]!
    "Every spell this asset has been held for, most recent first."
    assetAssignments(assetId: ID!): [AssetAssignment!]!
  }

  extend type Mutation {
    createAsset(input: AssetInput!): Asset!
    updateAsset(id: ID!, input: AssetInput!): Asset!
    deleteAsset(id: ID!): Boolean!
  }
`;
