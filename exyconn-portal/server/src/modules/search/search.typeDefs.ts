import gql from 'graphql-tag';

export const searchTypeDefs = gql`
  "One record the search box can jump to."
  type SearchHit {
    id: ID!
    title: String!
    subtitle: String!
    "Where it opens, including the portal path — e.g. /crm/deals or /hr/employees/123."
    link: String!
  }

  "One module's matches, grouped under the module's own name."
  type SearchGroup {
    key: String!
    label: String!
    hits: [SearchHit!]!
  }

  extend type Query {
    """
    Searches every module the caller's roles can open. Returns only groups that matched, and
    at most a handful from each — this answers "take me to that record", not "report on it".
    """
    search(query: String!): [SearchGroup!]!
  }
`;
