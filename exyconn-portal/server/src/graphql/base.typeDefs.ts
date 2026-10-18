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
    NOT_CONTAINS
    STARTS_WITH
    ENDS_WITH
    EQUALS
    NOT_EQUALS
    GT
    GTE
    LT
    LTE
    "Nothing stored, or an empty string; the filter's value is ignored."
    BLANK
    "Anything but blank; the filter's value is ignored."
    NOT_BLANK
    "Any of the filter's values; its value is ignored."
    IN
  }

  input TableSortInput {
    field: String!
    dir: SortDir!
  }

  input TableFilterInput {
    field: String!
    op: FilterOp!
    value: String!
    "The values an IN filter matches any of; other operators ignore it."
    values: [String!]
  }

  "Server-side pagination/sort/filter/search request. \`page\` is zero-indexed."
  input TableQueryInput {
    "Zero-based: 0 is the first page, so the first pageSize rows."
    page: Int!
    pageSize: Int!
    search: String
    sort: TableSortInput
    "Several sort columns, most significant first. When set it wins over sort."
    sorts: [TableSortInput!]
    filters: [TableFilterInput!]
    "True lists only archived rows; otherwise archived rows are left out."
    archived: Boolean
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
