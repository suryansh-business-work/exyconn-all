import gql from 'graphql-tag';

/** Root schema: the DateTime scalar plus empty Query/Mutation roots that every
 *  module extends. */
export const baseTypeDefs = gql`
  scalar DateTime
  scalar JSON

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;
