import gql from 'graphql-tag';

export const techTransferTypeDefs = gql`
  "One config in an Environment Variables section, for the per-item export."
  type TechConfigItem {
    id: ID!
    kind: String!
    label: String!
  }

  type TechImportResult {
    created: Int!
    updated: Int!
    skipped: Int!
    "Why each skipped item was skipped."
    messages: [String!]!
  }

  extend type Query {
    techConfigItems(section: String!): [TechConfigItem!]!
    """
    Environment Variables as a JSON file, every secret in full: one section (or all), or only
    the given configs. Needs the vault open; logged.
    """
    exportTechConfigs(section: String, ids: [ID!]): String!
  }

  extend type Mutation {
    """
    Imports an export file into one section (or everywhere). Listed configs arrive switched
    off; single configs (Google, Microsoft, social apps) are updated in place.
    """
    importTechConfigs(section: String, json: String!): TechImportResult!
  }
`;
