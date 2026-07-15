import gql from 'graphql-tag';

/** Root schema: the DateTime scalar plus empty Query/Mutation roots that every
 *  module extends. */
export const baseTypeDefs = gql`
  scalar DateTime
  scalar JSON

  # Shared server-side table controls, reused by every paginated portal grid.
  enum SortDir {
    ASC
    DESC
  }

  enum FilterOp {
    CONTAINS
    STARTS_WITH
    EQUALS
    GT
    LT
  }

  input TableSortInput {
    field: String!
    dir: SortDir!
  }

  input TableFilterInput {
    field: String!
    op: FilterOp!
    value: String!
  }

  "Server-side pagination/sort/filter/search request. \`page\` is zero-indexed."
  input TableQueryInput {
    page: Int!
    pageSize: Int!
    search: String
    sort: TableSortInput
    filters: [TableFilterInput!]
  }

  # Dashboard summary numbers computed server-side, so a page never fetches every row.
  type StatBucket {
    value: String!
    count: Int!
  }

  type StatFieldCounts {
    field: String!
    buckets: [StatBucket!]!
  }

  type StatFieldSum {
    field: String!
    total: Float!
  }

  type TableStats {
    total: Int!
    counts: [StatFieldCounts!]!
    sums: [StatFieldSum!]!
  }

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;
